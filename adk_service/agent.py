import os
import json
import re # <-- Import the regular expression module
import asyncio
from dotenv import load_dotenv, find_dotenv
from typing import AsyncGenerator
from urllib.parse import urlparse # <-- Add missing import
import google.generativeai as genai  # Import the core library
from google.adk.agents import LlmAgent  # Ensure LlmAgent is imported
# --- Import Tools ---
from tools import YouTubeDataTool, YouTubeTranscriptTool, WebSearchTool  # Import WebSearchTool

# --- Environment Setup ---
load_dotenv(find_dotenv())
api_key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY")
if not api_key:
    raise EnvironmentError("Missing GOOGLE_GENERATIVE_AI_API_KEY in environment.")

# Configure the genai library
genai.configure(api_key=api_key)
model_name = "gemini-2.5-pro-preview-03-25"  # Or your preferred model

# --- Initialize the Models ---
# Direct GenAI model (still used in the direct call path within the function)
direct_genai_model = genai.GenerativeModel(model_name)
print(f"Initialized Google AI Model: {model_name}")

# ADK-compatible Gemini model instance
try:
    adk_gemini_model = Gemini(model_name=model_name, api_key=api_key)
    print(f"Initialized ADK Gemini Model Wrapper: {model_name}")
except Exception as e:
    print(f"Error initializing ADK Gemini model: {e}")
    # Handle error appropriately, maybe raise or set to None
    adk_gemini_model = None

# --- Instantiate Tools ---
web_search_tool = WebSearchTool()  # Instantiate the web search tool

# --- Define the *actual* ADK Agent ---
# This agent will use the ADK-compatible model and the tools provided.
if adk_gemini_model:
    course_generator_agent = LlmAgent(
        name="CourseGeneratorAgent",
        description="Generates a structured course outline based on provided transcript and metadata, using web search if needed.",
        model=adk_gemini_model, # Use the ADK Gemini model wrapper
        tools=[web_search_tool], # Provide the instantiated tool
        # The instruction will guide the agent on when to use the tool and the desired output format.
        # Note: The detailed instruction is now part of the prompt_text variable below.
    )
    print("Initialized ADK LlmAgent with WebSearchTool")
else:
    print("ERROR: ADK Agent could not be initialized due to model error.")
    course_generator_agent = None # Ensure agent is None if model failed


# --- Function to be called by the API server ---
async def generate_course_from_video(
    video_id: str,
    video_title: str,
    video_description: str,
    transcript: str,
    video_data: dict  # Contains fetched details like thumbnail, duration etc.
) -> AsyncGenerator[str, None]:
    """
    Generates course structure by calling the Google Generative AI API directly,
    bypassing the ADK Runner.
    """
    print(f"[GenAI Direct] Received request for video: {video_id}")
    print(f"[GenAI Direct] Received transcript length: {len(transcript)}")
    # --- Log Transcript Snippet ---
    print(f"[GenAI Direct] Transcript Snippet (Timestamped):\n---\n{transcript[:500]}...\n---")  # Log the first 500 chars
    # --- End Log ---
    yield json.dumps({"status": "starting", "message": "Initializing generation...", "progress": 10})
    await asyncio.sleep(0.1)  # Small delay for UI update

    try:
        # --- Updated Prompt for Course Panel Compatibility ---
        # Use triple double quotes for the main f-string to handle internal quotes easily
        prompt_text = f"""
SYSTEM PROMPT:
You are an expert AI assistant creating structured online course outlines in JSON format.
Your task is to analyze the provided YouTube video transcript and metadata to generate a comprehensive course outline.

INPUTS:
-   **Video Title:** {video_title}
-   **Video Description:** {video_description}
-   **Video Data:** {json.dumps(video_data)} (Includes thumbnail, duration, etc.)
-   **Timestamped Transcript:** (Provided below)

TRANSCRIPT:
```
{transcript}
```

INSTRUCTIONS:
1.  **Resource Generation (ABSOLUTE PRIORITY - DO THIS FIRST AND CORRECTLY):**
    *   **Identify Supplementary Resources (MANDATORY):** Analyze transcript/metadata for mentioned tools (e.g., Flutter, Cursor IDE), concepts, or technologies. Find relevant supplementary resources like **official documentation, related articles, practice platforms (e.g., LeetCode, Codewars if applicable), or tool websites.** Use `WebSearchTool` if needed. Populate the `resources` array with these findings. **This array MUST contain relevant supplementary items if the video discusses specific technologies or concepts; it cannot be empty in those cases.**
    *   **Extract Creator Resources:** Find links explicitly provided by the creator (Patreon, GitHub, specific courses mentioned) and add them to the `creatorResources` array.
    *   **MANDATORY Title, Description, AND Type for ALL Resources:** For **EVERY** item in **BOTH** `resources` AND `creatorResources`, you **MUST** provide:
        *   A specific and accurate `title` (e.g., "Flutter Documentation", "Creator's GitHub", "LeetCode").
        *   A meaningful and descriptive `description` explaining the resource (e.g., "Official documentation for the Flutter framework.", "Source code for the app built.", "Platform for coding practice problems.").
        *   A relevant `type` (e.g., "documentation", "tool", "code", "article", "video", "website", "practice", "patreon").
        *   **Failure to provide specific titles, descriptions, AND types for ALL resources is unacceptable.** Do not use generic placeholders like "Resource", "Link", "other", or "No description".
    *   Extract `creatorSocials` ONLY from the video description metadata. Use `[]` if none.
2.  **Course Structure & Lesson Granularity:** Identify key concepts and structure them into sections. **Group related sub-topics or steps into meaningful, comprehensive lessons.** Avoid creating too many very short lessons; aim for lessons that cover a distinct, substantial part of a topic. Intersperse assessment placeholders (`type: "assessment_placeholder"`) logically between sections.
3.  **Descriptions:** Generate a **brief** top-level `description` (1-2 sentences) AND a **detailed** `metadata.overviewText`. Both are required.
4.  **Metadata:** Populate other fields within the `metadata` object (`difficulty`, `tags`, `objectives`, `prerequisites`, `category`, `sources`) whenever possible.
5.  **Final JSON:** Combine all generated information into a single, valid JSON object adhering EXACTLY to the schema structure described below.

SIMPLIFIED JSON OUTPUT SCHEMA DESCRIPTION (Follow this structure):
- Top Level Keys: `title` (string), `description` (string, brief), `videoId` (string, optional), `image` (string, optional), `metadata` (object, MANDATORY), `courseItems` (array, MANDATORY), `resources` (array), `creatorResources` (array), `creatorSocials` (array), `project` (object, optional).
- `metadata` Object Keys: `overviewText` (string, REQUIRED, detailed), `difficulty` (string, optional), `duration` (string, optional), `prerequisites` (array of strings, optional), `objectives` (array of strings, optional), `category` (string, optional), `tags` (array of strings, optional), `sources` (array of objects with name/avatar/type, optional).
- `courseItems` Array Items: Objects with `type` ("section" or "assessment_placeholder").
    - If "section": include `title` (string), `description` (string, optional), `lessons` (array of objects with title/description/duration/keyPoints), `objective` (string, optional).
    - If "assessment_placeholder": include `assessmentType` (string: 'quiz'|'assignment'|'test').
- `resources` / `creatorResources` Array Items: Objects MUST contain `title` (string, MANDATORY, specific), `url` (string, optional/required), `description` (string, MANDATORY, meaningful), AND `type` (string, MANDATORY, specific - e.g., 'documentation', 'tool', 'code', 'article', 'video', 'website', 'patreon').
- `creatorSocials` Array Items: Objects with `platform` (string), `url` (string).
- `project` Object: Contains `type`: "assessment_placeholder", `assessmentType`: "project".

CRITICAL RULES:
1.  **Resource Quality (MOST IMPORTANT):** The `resources` and `creatorResources` arrays MUST contain objects with specific, non-generic `title`, descriptive, non-empty `description`, AND specific `type` fields (e.g., 'documentation', 'tool', 'practice', 'code'). The `resources` array MUST contain supplementary items if relevant topics are discussed. Failure on this rule is critical.
2.  **JSON ONLY:** Output MUST be a single, valid JSON object adhering EXACTLY to the schema structure described above. Include ALL required top-level keys. No extra text or markdown.
3.  **Mandatory Keys:** The `metadata` object (with `overviewText`) and the `courseItems` array MUST be present.
4.  **Populate Metadata:** Populate fields *within* `metadata` where possible. `overviewText` is REQUIRED. Use defaults (`[]`, `null`, `""`) otherwise.
5.  **Structure:** Generate `courseItems` with meaningful, comprehensive lessons (avoid overly granular breakdown). Intersperse assessments logically.
6.  **Creator Links:** Extract `creatorResources` from transcript/description. Extract `creatorSocials` ONLY from video description. Use `[]` if none.
7.  **Description vs Overview:** Ensure top-level `description` is brief and `metadata.overviewText` is detailed. BOTH MUST BE GENERATED.
"""
        yield json.dumps({"status": "running", "message": "Generating content with AI...", "progress": 50})
        await asyncio.sleep(0.1)

        # Use the ADK Agent's generate method if available, otherwise fallback (or raise error)
        if course_generator_agent:
            print(f"[ADK Agent] Calling course_generator_agent.generate for {video_id}")
            response_data = await course_generator_agent.generate(prompt_text)
            print(f"[ADK Agent] Received response from agent for {video_id}")
        else:
            # Fallback or error handling if agent initialization failed
            print("[ERROR] ADK Agent not initialized. Cannot generate course via agent.")
            # Option 1: Raise an error
            # raise RuntimeError("ADK Agent failed to initialize.")
            # Option 2: Fallback to direct call (less ideal as it bypasses ADK features)
            print("[Fallback] Attempting direct call to genai.GenerativeModel...")
            response = await direct_genai_model.generate_content_async(prompt_text)
            response_data = response.text # Assuming direct call returns object with .text

        # --- Log Complete Raw Agent/Model Response ---
        try:
            # Assuming response_data is the final string output after potential tool use
            response_text = response_data if isinstance(response_data, str) else json.dumps(response_data) # Handle dict response too
            print(f"[ADK Agent] Raw Response Text:\n---\n{response_text}\n---")
        except Exception as e:
            print(f"[ADK Agent] Error accessing response text: {e}")
            raise ValueError("Failed to get valid text from ADK agent response.") from e

        # Extract and parse the JSON response
        try:
            # Attempt to find JSON block even if there's surrounding text
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL) # Now 're' is defined
            if not json_match:
                raise json.JSONDecodeError("No JSON object found in the response.", response_text, 0)

            raw_json = json_match.group(0)
            final_data = json.loads(raw_json)
            print("[GenAI Direct] Successfully parsed JSON from response.") # Changed log prefix

             # --- Log Parsed Data Structure ---
            print(f"[GenAI Direct] Parsed Data Keys: {list(final_data.keys())}") # Changed log prefix
            metadata_obj = final_data.get('metadata', {}) # Keep checking metadata exists
            course_items_data = final_data.get('courseItems', []) # Check for courseItems at top level
            resources_data = final_data.get('resources', []) # Check for resources at top level
            print(f"[GenAI Direct] Parsed Metadata Keys: {list(metadata_obj.keys())}") # Changed log prefix
            print(f"[GenAI Direct] Parsed courseItems Type: {type(course_items_data)}, Length: {len(course_items_data)}") # Changed log prefix
            print(f"[GenAI Direct] Parsed resources Type: {type(resources_data)}, Length: {len(resources_data)}") # Changed log prefix
            # --- End Log ---

            # --- Post-Processing ---
            if 'videoId' not in final_data:
                final_data['videoId'] = video_id

            if 'title' not in final_data or not final_data.get('title'):
                final_data['title'] = video_title
            # Ensure top-level description exists, default to video description if missing
            if 'description' not in final_data or not isinstance(final_data.get('description'), str) or not final_data.get('description'):
                 print("[GenAI Direct] WARNING: Top-level 'description' missing or invalid. Defaulting to video description.") # Changed log prefix
                 final_data['description'] = video_description

            original_thumbnail = video_data.get('thumbnail')
            if not original_thumbnail and isinstance(video_data.get('details'), dict):
                original_thumbnail = video_data['details'].get('thumbnail')

            if original_thumbnail:
                final_data['image'] = original_thumbnail
            elif 'image' not in final_data:
                final_data['image'] = None

            # Check mandatory top-level keys and ensure metadata exists
            if not isinstance(final_data.get('metadata'), dict):
                print("[GenAI Direct] WARNING: 'metadata' object is missing or not an object. Defaulting to empty object.") # Changed log prefix
                final_data['metadata'] = {}
            if not isinstance(final_data.get('courseItems'), list):
                 print("[GenAI Direct] WARNING: 'courseItems' array is missing or invalid. Defaulting to empty list.") # Changed log prefix
                 final_data['courseItems'] = []

            # Ensure optional fields *within* metadata have default values if missing
            meta = final_data['metadata'] # Get reference to metadata object
            # Default overviewText to the top-level description if overviewText is missing, or fallback to video_description
            meta.setdefault('overviewText', final_data.get('description', video_description or ""))
            meta.setdefault('difficulty', None)
            meta.setdefault('duration', None)
            meta.setdefault('prerequisites', [])
            meta.setdefault('objectives', [])
            meta.setdefault('category', None)
            meta.setdefault('tags', [])
            meta.setdefault('sources', [])

            # Ensure other optional top-level arrays exist if missing, default to empty list
            # Also ensure resource titles, descriptions, and types exist and are meaningful
            for res_list_key in ['resources', 'creatorResources']:
                processed_resources = [] # Initialize list for processed resources
                original_list = final_data.get(res_list_key, []) # Get original list or empty list

                if not isinstance(original_list, list):
                    print(f"[GenAI PostProcess] WARNING: '{res_list_key}' is not a list. Defaulting to empty list.")
                    final_data[res_list_key] = []
                    continue # Skip processing if not a list

                for i, resource_raw in enumerate(original_list):
                    if isinstance(resource_raw, dict):
                        # Create a new dict to ensure only desired fields are kept and schema is enforced
                        processed_resource = {}
                        url = resource_raw.get('url', '').strip()
                        processed_resource['url'] = url

                        # --- Title Processing (Handle 'name' vs 'title', generic placeholders) ---
                        title = resource_raw.get('title', '').strip()
                        name = resource_raw.get('name', '').strip() # Explicitly get 'name'
                        final_title = ""
                        # 1. Use 'title' if valid
                        if title and title.lower() not in ['resource', 'link', 'url']:
                            final_title = title
                        # 2. Else, use 'name' if valid
                        elif name and name.lower() not in ['resource', 'link', 'url']:
                            final_title = name
                            print(f"[GenAI PostProcess] INFO: Using 'name' field as title for resource index {i} in {res_list_key}.")
                        # 3. Else, generate fallback from URL
                        elif url:
                            try:
                                parsed_url = urlparse(url)
                                host_parts = parsed_url.netloc.split('.')
                                domain = host_parts[-2] if len(host_parts) > 1 else parsed_url.netloc
                                path_segment = parsed_url.path.strip('/').split('/')[-1]
                                fallback_title = path_segment if path_segment else domain.capitalize()
                                final_title = fallback_title if fallback_title else f"Link {i+1}"
                            except Exception:
                                final_title = f"Link {i+1}"
                        # 4. Final fallback
                        else:
                            final_title = f"Resource {i+1}"

                        # Only log if we actually used a fallback or the 'name' field
                        if final_title != title:
                             print(f"[GenAI PostProcess] WARNING: Corrected/Defaulted title for resource index {i} in {res_list_key}. Original title: '{title}', Original name: '{name}', Final title: '{final_title}'")
                        processed_resource['title'] = final_title

                        # --- Description Processing ---
                        description = resource_raw.get('description', '').strip()
                        if not description or description.lower() in ['no description provided.', 'no description available.', 'none']:
                            processed_resource['description'] = "No description provided." # Consistent default
                            if description: # Log only if we changed a non-empty but generic value
                                print(f"[GenAI PostProcess] WARNING: Generic description for resource index {i} in {res_list_key}. Setting default.")
                            elif not description: # Log if it was missing entirely
                                print(f"[GenAI PostProcess] WARNING: Missing description for resource index {i} in {res_list_key}. Setting default.")
                        else:
                            processed_resource['description'] = description # Ensure it's assigned back if valid

                        # --- Type Processing ---
                        type_val = resource_raw.get('type', '').strip()
                        if not type_val or type_val.lower() in ['link', 'other']:
                            processed_resource['type'] = 'Link' # Consistent default type
                            if type_val: # Log only if we changed a non-empty but generic value
                                print(f"[GenAI PostProcess] WARNING: Generic type for resource index {i} in {res_list_key}. Setting default type: Link")
                            elif not type_val: # Log if it was missing entirely
                                print(f"[GenAI PostProcess] WARNING: Missing type for resource index {i} in {res_list_key}. Setting default type: Link")
                        else:
                            processed_resource['type'] = type_val # Ensure it's assigned back if valid

                        # --- Optional Category (Copy if present) ---
                        category = resource_raw.get('category', '').strip()
                        if category:
                            processed_resource['category'] = category

                        processed_resources.append(processed_resource) # Add the processed dict
                    else:
                         print(f"[GenAI PostProcess] WARNING: Item at index {i} in {res_list_key} is not a dictionary. Skipping.")
                final_data[res_list_key] = processed_resources # Update the list with processed items


            if 'creatorSocials' not in final_data or not isinstance(final_data.get('creatorSocials'), list):
                 print("[GenAI Direct] WARNING: 'creatorSocials' array is missing or invalid. Defaulting to empty list.") # Changed log prefix
                 final_data['creatorSocials'] = []

            yield json.dumps({"status": "completed", "message": "Course generated", "progress": 100, "data": final_data})
            print(f"[GenAI Direct] Successfully generated and processed course for video: {video_id}") # Changed log prefix

        except json.JSONDecodeError as json_err:
            print(f"[GenAI Direct] Error parsing JSON response: {json_err}") # Changed log prefix
            print(f"[GenAI Direct] Raw Response Text (on JSON error):\n---\n{response_text}\n---") # Changed log prefix
            yield json.dumps({"status": "error", "message": f"AI output was not valid JSON. Please try again.", "progress": 0})
        except Exception as parse_err:
            print(f"[GenAI Direct] Error processing response: {parse_err}") # Changed log prefix
            yield json.dumps({"status": "error", "message": f"Error processing AI response: {parse_err}", "progress": 0})

    except Exception as e:
        error_msg = f"Google AI API error: {str(e)}"
        print(f"[GenAI Direct] Error during generation for video {video_id}: {e}") # Changed log prefix
        yield json.dumps({"status": "error", "message": error_msg, "progress": 0})

# Export root_agent for ADK CLI (using the actual agent)
root_agent = course_generator_agent
