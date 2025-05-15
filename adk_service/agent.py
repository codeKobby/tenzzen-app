import os
import json
import re
import time
import asyncio
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
model_name = "gemini-1.5-flash"  # Using Gemini 1.5 Flash for better quota limits

# Direct GenAI model (for course generation)
direct_genai_model = genai.GenerativeModel(
    model_name=model_name,
    generation_config={
        "temperature": 0.7,
        "top_p": 0.95,
        "top_k": 64,
        "max_output_tokens": 8192,
    }
)
print(f"Initialized Google AI Model: {model_name} for course generation")

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
        # --- Simplified Prompt for Gemini 1.5 Compatibility ---
        prompt_text = f"""
You are an expert AI assistant creating structured online course outlines in JSON format.
Analyze the provided YouTube video transcript and metadata to generate a comprehensive course outline.

Video Title: {video_title}
Video Description: {video_description}
Video Data: {json.dumps(video_data)} (Includes thumbnail, duration, etc.)

Transcript:
{transcript}

Your task is to:
1. Create a course structure with sections and lessons based on the video content
2. Extract timestamps for each lesson from the transcript
3. Identify resources mentioned in the video
4. Generate metadata like difficulty level, prerequisites, and learning objectives
5. Return a valid JSON object with the following structure:

```json
{{
  "title": "Course title based on video",
  "description": "Brief 1-2 sentence description",
  "videoId": "{video_id}",
  "image": "thumbnail URL from video_data",
  "metadata": {{
    "overviewText": "Detailed course overview (required)",
    "difficulty": "Beginner/Intermediate/Advanced",
    "prerequisites": ["prerequisite 1", "prerequisite 2"],
    "objectives": ["objective 1", "objective 2"],
    "category": "Programming/Design/etc",
    "tags": ["tag1", "tag2"]
  }},
  "courseItems": [
    {{
      "type": "section",
      "title": "Section title",
      "description": "Section description",
      "lessons": [
        {{
          "title": "Lesson title",
          "description": "Lesson description",
          "startTime": 120,
          "keyPoints": ["key point 1", "key point 2"]
        }}
      ]
    }},
    {{
      "type": "assessment_placeholder",
      "assessmentType": "quiz"
    }}
  ],
  "resources": [
    {{
      "title": "Resource title (specific)",
      "description": "Resource description (meaningful)",
      "url": "https://example.com",
      "type": "documentation/tool/article/video/website"
    }}
  ],
  "creatorResources": [],
  "creatorSocials": []
}}
```

Important requirements:
- Output MUST be valid JSON only, no extra text
- Include startTime (in seconds) for each lesson
- Provide specific titles and descriptions for resources
- Generate both brief description and detailed overviewText
- Group related topics into meaningful lessons (avoid too many short lessons)

Return only the JSON object, nothing else.
"""
        print("[GenAI Direct] Calling direct GenAI with prompt for course generation")

        # Use async call to generate content with retry logic
        max_retries = 5
        base_delay = 6  # Start with the retry delay from the error message (6 seconds)
        retry_count = 0
        last_error = None

        while retry_count <= max_retries:
            try:
                print(f"[GenAI Direct] Attempt {retry_count + 1}/{max_retries + 1}")
                response = await direct_genai_model.generate_content_async(prompt_text)
                response_text = response.text
                print(f"[GenAI Direct] Received response for {video_id}")
                break  # Success, exit the retry loop
            except Exception as e:
                last_error = e
                retry_count += 1

                # Check if it's a quota error
                error_str = str(e).lower()
                if "quota" in error_str or "rate limit" in error_str or "429" in error_str:
                    # Calculate exponential backoff delay
                    delay = base_delay * (2 ** (retry_count - 1))

                    # Extract retry delay from error message if available
                    retry_delay_match = re.search(r'retry_delay\s*{\s*seconds:\s*(\d+)', str(e))
                    if retry_delay_match:
                        suggested_delay = int(retry_delay_match.group(1))
                        delay = max(delay, suggested_delay)  # Use the larger of the two

                    print(f"[GenAI Direct] Rate limit exceeded. Retrying in {delay} seconds...")
                    await asyncio.sleep(delay)
                    continue

                # For non-quota errors, or if we've exhausted retries
                if retry_count > max_retries:
                    print(f"[GenAI Direct] Max retries exceeded. Last error: {e}")
                    raise e

                # For other errors, use a shorter delay
                print(f"[GenAI Direct] Error: {e}. Retrying in {base_delay} seconds...")
                await asyncio.sleep(base_delay)

        # If we've exhausted retries without success
        if retry_count > max_retries and last_error:
            raise last_error

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
