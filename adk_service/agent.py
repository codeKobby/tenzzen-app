import os
import json
import re
from typing import Dict, Any
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai
from tools import WebSearchTool

# --- Environment Setup ---
load_dotenv(find_dotenv())
api_key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY")
if not api_key:
    raise EnvironmentError("Missing GOOGLE_GENERATIVE_AI_API_KEY in environment.")

# Configure the genai library for direct calls
genai.configure(api_key=api_key)
model_name = "models/gemini-2.5-pro-exp-03-25"  # Using the experimental model with free tier

# Direct GenAI model (for course generation)
direct_genai_model = genai.GenerativeModel(model_name)
print(f"Initialized Google AI Model: {model_name}")

# --- Instantiate Tools ---
web_search_tool = WebSearchTool()  # Instantiate the web search tool

# --- Direct Function for Course Generation ---
async def generate_course_from_video(
    video_id: str,
    video_title: str,
    video_description: str,
    transcript: str,
    video_data: dict  # Contains fetched details like thumbnail, duration etc.
) -> Dict[str, Any]:
    """
    Generates course structure using direct GenAI API call.
    Returns a complete course data structure as a dictionary.
    """
    print(f"[generate_course_from_video] Received request for video: {video_id}")
    print(f"[generate_course_from_video] Transcript length: {len(transcript)}")
    print(f"[generate_course_from_video] Transcript Snippet (Timestamped):\n---\n{transcript[:500]}...\n---")

    try:
        # --- Updated Prompt for Course Panel Compatibility ---
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
5.  **Video Timestamps:** For each lesson, extract and include a `startTime` property that indicates when in the video (in seconds) this lesson's topic begins. This is CRITICAL for user navigation. Use the transcript's timestamps to accurately determine these start times.
6.  **Final JSON:** Combine all generated information into a single, valid JSON object adhering EXACTLY to the schema structure described below.

SIMPLIFIED JSON OUTPUT SCHEMA DESCRIPTION (Follow this structure):
- Top Level Keys: `title` (string), `description` (string, brief), `videoId` (string, optional), `image` (string, optional), `metadata` (object, MANDATORY), `courseItems` (array, MANDATORY), `resources` (array), `creatorResources` (array), `creatorSocials` (array), `project` (object, optional).
- `metadata` Object Keys: `overviewText` (string, REQUIRED, detailed), `difficulty` (string, optional), `duration` (string, optional), `prerequisites` (array of strings, optional), `objectives` (array of strings, optional), `category` (string, optional), `tags` (array of strings, optional), `sources` (array of objects with name/avatar/type, optional).
- `courseItems` Array Items: Objects with `type` ("section" or "assessment_placeholder").
    - If "section": include `title` (string), `description` (string, optional), `lessons` (array of objects with title/description/duration/keyPoints/startTime), `objective` (string, optional).
    - For each lesson, INCLUDE a `startTime` (number) property that represents the seconds into the video where this lesson begins.
    - If "assessment_placeholder": include `assessmentType` (string: 'quiz'|'assignment'|'test').
- `resources` / `creatorResources` Array Items: Objects MUST contain `title` (string, MANDATORY, specific), `url` (string, optional/required), `description` (string, MANDATORY, meaningful), AND `type` (string, MANDATORY, specific - e.g., 'documentation', 'tool', 'code', 'article', 'video', 'website', 'patreon').
- `creatorSocials` Array Items: Objects with `platform` (string), `url` (string).
- `project` Object: Contains `type`: "assessment_placeholder", `assessmentType`: "project".

CRITICAL RULES:
1.  **Resource Quality (MOST IMPORTANT):** The `resources` and `creatorResources` arrays MUST contain objects with specific, non-generic `title`, descriptive, non-empty `description`, AND specific `type` fields (e.g., 'documentation', 'tool', 'practice', 'code'). The `resources` array MUST contain supplementary items if relevant topics are discussed. Failure on this rule is critical.
2.  **JSON ONLY:** Output MUST be a single, valid JSON object adhering EXACTLY to the schema structure described above. Include ALL required top-level keys. No extra text or markdown.
3.  **Mandatory Keys:** The `metadata` object (with `overviewText`) and the `courseItems` array MUST be present.
4.  **Timestamps Required:** For each lesson in a section, the `startTime` property MUST be included, representing seconds into the video. This is CRITICAL for user navigation.
5.  **Populate Metadata:** Populate fields *within* `metadata` where possible. `overviewText` is REQUIRED. Use defaults (`[]`, `null`, `""`) otherwise.
6.  **Structure:** Generate `courseItems` with meaningful, comprehensive lessons (avoid overly granular breakdown). Intersperse assessments logically.
7.  **Creator Links:** Extract `creatorResources` from transcript/description. Extract `creatorSocials` ONLY from video description. Use `[]` if none.
8.  **Description vs Overview:** Ensure top-level `description` is brief and `metadata.overviewText` is detailed. BOTH MUST BE GENERATED.
"""
        print("[GenAI Direct] Calling direct GenAI with prompt for course generation")

        # Use async call to generate content
        response = await direct_genai_model.generate_content_async(prompt_text)
        response_text = response.text

        print(f"[GenAI Direct] Received response for {video_id}")

        # Process the response to extract JSON
        try:
            # Attempt to find JSON block even if there's surrounding text
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if not json_match:
                raise json.JSONDecodeError("No JSON object found in the response.", response_text, 0)

            raw_json = json_match.group(0)
            final_data = json.loads(raw_json)
            print("[PostProcess] Successfully parsed JSON from response.")

            # Log some key information about the parsed data
            print(f"[PostProcess] Parsed Data Keys: {list(final_data.keys())}")

            # Post-processing to ensure required fields are present
            if 'videoId' not in final_data:
                final_data['videoId'] = video_id
            if 'title' not in final_data or not final_data.get('title'):
                final_data['title'] = video_title
            if 'image' not in final_data and video_data.get('thumbnail'):
                final_data['image'] = video_data.get('thumbnail')

            # Return the final processed data
            return final_data

        except json.JSONDecodeError as json_err:
            print(f"[PostProcess] Error parsing JSON response: {json_err}")
            raise ValueError(f"AI output was not valid JSON: {json_err}")
        except Exception as parse_err:
            print(f"[PostProcess] Error processing response: {parse_err}")
            raise ValueError(f"Error processing AI response: {parse_err}")

    except Exception as e:
        error_msg = f"Google AI API error: {str(e)}"
        print(f"[GenAI Direct] Error during generation for video {video_id}: {e}")
        # Return error object instead of raising
        return {
            "error": error_msg,
            "videoId": video_id,
            "title": video_title or "Error generating course",
            "description": "There was an error generating this course.",
            "metadata": {"overviewText": error_msg},
            "courseItems": []
        }

# Export root_agent for ADK CLI compatibility (if needed)
root_agent = None
