import os
import json
import asyncio
from dotenv import load_dotenv, find_dotenv
from typing import AsyncGenerator
import google.generativeai as genai  # Import the core library
from google.adk.agents import LlmAgent  # Ensure LlmAgent is imported
from google.adk.models import Gemini  # Ensure Gemini is imported
# --- Import Tools ---
from tools import YouTubeDataTool, YouTubeTranscriptTool, WebSearchTool  # Import WebSearchTool

# --- Environment Setup ---
load_dotenv(find_dotenv())
api_key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY")
if not api_key:
    raise EnvironmentError("Missing GOOGLE_GENERATIVE_AI_API_KEY in environment.")

# Configure the genai library
genai.configure(api_key=api_key)
model_name = "gemini-2.5-pro-preview-03-25"  # Use the specified 2.5 model

# --- Instantiate Tools ---
web_search_tool = WebSearchTool()  # Instantiate the web search tool

# --- Function to be called by the API server ---
async def generate_course_from_video(
    video_id: str,
    video_title: str,
    video_description: str,
    transcript: str,
    video_data: dict
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
        # --- Direct GenAI Call ---
        print(f"[GenAI Direct] Calling model: {model_name}")
        model = genai.GenerativeModel(model_name)

        # --- Prompt with Resource Categorization --- 
        prompt_text = f"""
SYSTEM PROMPT:
You are an AI course structuring assistant specializing in JSON generation.
Your task is to analyze the provided YouTube video transcript (timestamped) and metadata to create a complete and well-structured learning course.

CRITICAL RULES:
1. Output ONLY valid JSON. No introductory text, explanations, or closing remarks. Just the JSON object.
2. Use the provided `video_title` and `video_description` as input, but GENERATE your own concise `title` and `description` fields in the output JSON appropriate for the course.
3. You MUST GENERATE the following fields based on your analysis:
   - category, tags, difficulty, prerequisites, objectives, overviewText.
   - resources: Array of 3-10 relevant resources. MUST NOT BE EMPTY. Populate fully.
   - sections: Array of 2-7 logically grouped sections with lessons. MUST NOT BE EMPTY. Populate fully based on transcript/chapters.
   - project: Final section marker {{"assessment": "project"}}.

4. **Section and Lesson Generation Strategy:** (Use chapters if available, otherwise analyze transcript. Use timestamps.)

5. **Resources Structure & Categorization:**
   - Each resource object MUST have: `title`, `url`, `description`, `type` (["documentation", "tutorial", "article", "video", "code", "blog", "tool", "book"]), and `source`.
   - The `source` field MUST indicate the origin:
     - "video": If the resource was explicitly mentioned or shown in the video/description.
     - "supplementary": For general relevant resources found via web search/knowledge.
     - "practice": For interactive platforms like CodePen, LeetCode, etc., relevant to the topic.
   - Include a mix of resource sources. Use web search knowledge to find supplementary and practice resources.

6. Section Structure: (id, title, description, startTime, endTime, objective, keyPoints, lessons: array, assessment: optional 'quiz'/'assignment')
7. Lesson Structure: (id, title, description, startTime, endTime, keyPoints)
8. Project Section: Must be final section, only {{"assessment": "project"}}.

INPUT VIDEO METADATA (JSON):
{json.dumps(video_data, indent=2)}

INPUT TIMESTAMPED TRANSCRIPT (Format: MM:SS\nText Segment\n\nMM:SS\nText Segment...):
---
{transcript[:30000]} # Limit transcript length if needed
---
Output only the final JSON object. Ensure 'sections' and 'resources' arrays are fully populated with detailed objects, including the categorized 'source' for each resource.
"""
        yield json.dumps({"status": "running", "message": "Generating content with AI...", "progress": 50})
        await asyncio.sleep(0.1)

        # Generate content (non-streaming for simplicity first)
        response = await model.generate_content_async(prompt_text)  # Use async version

        print("[GenAI Direct] Received response from model.")
        # --- Log Complete Raw AI Response ---
        print(f"[GenAI Direct] Raw Response Text:\n{response.text}\n--- End Raw Response ---")  # Log the *full* raw response text
        # --- End Log ---

        # Extract and parse the JSON response
        try:
            # Clean potential markdown code block fences
            raw_json = response.text.strip().replace('```json', '').replace('```', '').strip()
            final_data = json.loads(raw_json)

            # --- Log Parsed Data Structure ---
            print(f"[GenAI Direct] Parsed Data Keys: {list(final_data.keys())}")
            sections_data = final_data.get('sections', [])
            resources_data = final_data.get('resources', [])
            print(f"[GenAI Direct] Parsed Sections Type: {type(sections_data)}, Length: {len(sections_data)}")
            print(f"[GenAI Direct] Parsed Resources Type: {type(resources_data)}, Length: {len(resources_data)}")
            if sections_data:
                first_section = sections_data[0]
                print(f"[GenAI Direct] First Section Keys: {list(first_section.keys()) if isinstance(first_section, dict) else 'N/A'}")
                if isinstance(first_section, dict):
                    lessons_data = first_section.get('lessons', [])
                    if lessons_data:
                        first_lesson = lessons_data[0]
                        print(f"[GenAI Direct] First Lesson Keys: {list(first_lesson.keys()) if isinstance(first_lesson, dict) else 'N/A'}")
            # --- End Log ---

            # --- Refined Post-Processing ---
            # Add essential IDs/metadata - Use AI generated if present, otherwise fallback
            if 'videoId' not in final_data: final_data['videoId'] = video_id
            if 'title' not in final_data: final_data['title'] = video_title
            if 'description' not in final_data: final_data['description'] = video_description

            # --- Always add back the original thumbnail ---
            # The AI doesn't generate images, so we always use the fetched one.
            if 'thumbnail' in video_data.get('details', {}):
                 final_data['image'] = video_data['details']['thumbnail']
            elif 'image' not in final_data: # Fallback if details missing but AI didn't add image
                 final_data['image'] = None # Or a placeholder URL
            # --- End Thumbnail Fix ---

            yield json.dumps({"status": "completed", "message": "Course generated", "progress": 100, "data": final_data})
            print(f"[GenAI Direct] Successfully generated course for video: {video_id}")

        except json.JSONDecodeError as json_err:
            print(f"[GenAI Direct] Error parsing JSON response: {json_err}")
            print(f"[GenAI Direct] Raw Response Text: {response.text[:500]}...")  # Log raw response on error
            yield json.dumps({"status": "error", "message": f"AI failed to produce valid JSON: {json_err}", "progress": 0})
        except Exception as parse_err:
            print(f"[GenAI Direct] Error processing response: {parse_err}")
            yield json.dumps({"status": "error", "message": f"Error processing AI response: {parse_err}", "progress": 0})

    except Exception as e:
        # Handle potential errors from the genai library (e.g., API errors, safety blocks)
        error_msg = f"Google AI API error: {str(e)}"
        print(f"[GenAI Direct] Error during generation for video {video_id}: {e}")
        yield json.dumps({"status": "error", "message": error_msg, "progress": 0})

# --- Keep dummy ADK agent definition if server.py imports it ---
# This part is now effectively unused by the core logic but might be needed
# to prevent import errors in server.py depending on how it's written.
# Add tool to dummy agent if server.py imports and uses its tool list
dummy_model = Gemini(model_name=model_name, api_key=api_key)
course_generator_agent = LlmAgent(name="DummyAgentForImport", model=dummy_model, tools=[web_search_tool])
root_agent = course_generator_agent
# --- End Dummy Definition ---
