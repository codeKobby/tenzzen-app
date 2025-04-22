import os
import json
import isodate # Required for parsing YouTube duration
from google.adk.tools import BaseTool # Changed from Tool
from googleapiclient.discovery import build
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import requests
import asyncio

# Helper function to format duration (similar to frontend)
def format_duration(duration_iso: str) -> str:
    if not duration_iso:
        return "00:00"
    try:
        duration = isodate.parse_duration(duration_iso)
        total_seconds = int(duration.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        if hours > 0:
            return f"{hours:02}:{minutes:02}:{seconds:02}"
        else:
            return f"{minutes:02}:{seconds:02}"
    except Exception:
        return "00:00"

# Helper function to format views (similar to frontend)
def format_views(views_str: str) -> str:
    try:
        views = int(views_str)
        if views >= 1_000_000_000:
            return f"{views / 1_000_000_000:.1f}B"
        elif views >= 1_000_000:
            return f"{views / 1_000_000:.1f}M"
        elif views >= 1_000:
            return f"{views / 1_000:.1f}K"
        else:
            return str(views)
    except (ValueError, TypeError):
        return "0"


class YouTubeDataTool(BaseTool): # Inherit from BaseTool
    def __init__(self):
        super().__init__(
            name="YouTubeDataTool",
            description="Fetches details for a given YouTube video ID (title, description, channel info, duration, stats). Returns details as a JSON string.",
            # Input schema could be defined using Pydantic if needed
            # parameters_schema=pydantic_schema_for_video_id
        )
        self.api_key = os.getenv("YOUTUBE_API_KEY")
        if not self.api_key:
            # In a real app, handle this more gracefully (e.g., raise specific error)
            print("Warning: YOUTUBE_API_KEY environment variable not set.")
            self.youtube = None
        else:
            try:
                # Build the service object
                self.youtube = build('youtube', 'v3', developerKey=self.api_key)
            except Exception as e:
                print(f"Error initializing YouTube client: {e}")
                self.youtube = None

    async def _execute(self, video_id: str) -> str:
        """Fetches video details from YouTube Data API."""
        if not self.youtube:
            return json.dumps({"error": "YouTube client not initialized. Check API key."})
        if not video_id:
             return json.dumps({"error": "No video_id provided."})

        try:
            print(f"YouTubeDataTool: Fetching details for video ID: {video_id}")
            request = self.youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=video_id
            )
            response = request.execute()

            if not response.get("items"):
                print(f"YouTubeDataTool: Video not found for ID: {video_id}")
                return json.dumps({"error": "Video not found"})

            video_data = response["items"][0]
            snippet = video_data.get("snippet", {})
            content_details = video_data.get("contentDetails", {})
            statistics = video_data.get("statistics", {})

            # Extract thumbnail URL (prefer higher resolution)
            thumbnails = snippet.get("thumbnails", {})
            thumbnail_url = thumbnails.get("maxres", {}).get("url") or \
                            thumbnails.get("high", {}).get("url") or \
                            thumbnails.get("standard", {}).get("url") or \
                            thumbnails.get("medium", {}).get("url") or \
                            thumbnails.get("default", {}).get("url") or ""

            details = {
                "id": video_id,
                "title": snippet.get("title", "Unknown Title"),
                "description": snippet.get("description", ""),
                "thumbnail": thumbnail_url,
                "duration_iso": content_details.get("duration"), # Keep ISO for potential use
                "duration_formatted": format_duration(content_details.get("duration")),
                "channelId": snippet.get("channelId"),
                "channelTitle": snippet.get("channelTitle"),
                # "channelAvatar": "", # Fetching avatar requires another API call - skip for now
                "views": format_views(statistics.get("viewCount")),
                "likes": format_views(statistics.get("likeCount")),
                "publishDate": snippet.get("publishedAt"),
            }
            print(f"YouTubeDataTool: Successfully fetched details for {video_id}")
            return json.dumps(details) # Return details as a JSON string

        except Exception as e:
            print(f"Error in YouTubeDataTool for {video_id}: {e}")
            return json.dumps({"error": f"Failed to fetch video details: {str(e)}"})

class YouTubeTranscriptTool(BaseTool): # Inherit from BaseTool
    def __init__(self):
        super().__init__(
            name="YouTubeTranscriptTool",
            description="Fetches the transcript for a given YouTube video ID. Returns the transcript as a JSON string containing either the full text or an error.",
             # parameters_schema=pydantic_schema_for_video_id_and_lang
        )

    async def _execute(self, video_id: str, preferred_language: str = "en") -> str:
        """Fetches transcript using youtube_transcript_api."""
        if not video_id:
             return json.dumps({"error": "No video_id provided."})

        try:
            print(f"YouTubeTranscriptTool: Fetching transcript for video ID: {video_id}")
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

            transcript = None
            found_lang = None

            # Try finding the exact preferred language transcript
            try:
                transcript = transcript_list.find_transcript([preferred_language])
                found_lang = preferred_language
                print(f"YouTubeTranscriptTool: Found exact language transcript: {found_lang}")
            except NoTranscriptFound:
                # Try finding generated preferred language transcript
                try:
                    transcript = transcript_list.find_generated_transcript([preferred_language])
                    found_lang = f"{preferred_language} (generated)"
                    print(f"YouTubeTranscriptTool: Found generated language transcript: {found_lang}")
                except NoTranscriptFound:
                    # Fallback to English if preferred wasn't 'en'
                    if preferred_language != 'en':
                        try:
                            transcript = transcript_list.find_transcript(['en'])
                            found_lang = 'en'
                            print(f"YouTubeTranscriptTool: Found fallback language transcript: {found_lang}")
                        except NoTranscriptFound:
                            try:
                                transcript = transcript_list.find_generated_transcript(['en'])
                                found_lang = 'en (generated)'
                                print(f"YouTubeTranscriptTool: Found generated fallback language transcript: {found_lang}")
                            except NoTranscriptFound:
                                pass # Continue to check any available

            # If still no transcript, try the first available one
            if not transcript:
                available_langs = [t.language for t in transcript_list]
                if available_langs:
                    try:
                        transcript = transcript_list.find_transcript([available_langs[0]])
                        found_lang = available_langs[0]
                        print(f"YouTubeTranscriptTool: Found first available language transcript: {found_lang}")
                    except NoTranscriptFound:
                         # Should not happen if available_langs is not empty, but handle defensively
                         pass


            if not transcript:
                 print(f"YouTubeTranscriptTool: No suitable transcript found for {video_id}")
                 return json.dumps({"error": "No suitable transcript found."})

            # Fetch the actual transcript segments
            transcript_data = transcript.fetch()
            print(f"YouTubeTranscriptTool: Successfully fetched transcript ({found_lang}) for {video_id}")

            # Combine segments into a single string
            full_transcript = " ".join([segment['text'].replace('\n', ' ').strip() for segment in transcript_data])

            # Return JSON with the full transcript text
            return json.dumps({
                "transcript": full_transcript,
                "language": found_lang
            })

        except TranscriptsDisabled:
            print(f"YouTubeTranscriptTool: Transcripts disabled for video {video_id}")
            return json.dumps({"error": "Transcripts are disabled for this video."})
        except NoTranscriptFound:
             print(f"YouTubeTranscriptTool: No transcript found for video {video_id} in any language.")
             return json.dumps({"error": "No transcript could be found for this video."})
        except Exception as e:
            print(f"Error in YouTubeTranscriptTool for {video_id}: {e}")
            return json.dumps({"error": f"Failed to fetch transcript: {str(e)}"})

# --- Web Search Tool Implementation ---
class WebSearchTool(BaseTool): # Inherit from BaseTool
    def __init__(self):
        super().__init__(
            name="WebSearchTool",
            description="Performs a web search using an external API and returns top results as JSON.",
            # parameters_schema=... Pydantic schema for query, num_results etc. could be added
        )
        # Retrieve API key and endpoint from environment variables
        self.search_api_key = os.getenv("SEARCH_API_KEY") # You need to set this in your .env
        self.search_api_endpoint = os.getenv("SEARCH_API_ENDPOINT", "YOUR_SEARCH_API_ENDPOINT") # Set this in .env or replace default

        if not self.search_api_key:
            print("Warning: SEARCH_API_KEY environment variable not set for WebSearchTool.")
        if self.search_api_endpoint == "YOUR_SEARCH_API_ENDPOINT":
             print("Warning: SEARCH_API_ENDPOINT environment variable not set for WebSearchTool. Using placeholder.")


    async def _execute(self, query: str, num_results: int = 5) -> str:
        """Performs a web search and returns formatted results."""
        if not self.search_api_key:
            return json.dumps({"error": "Search API key not configured."})
        if self.search_api_endpoint == "YOUR_SEARCH_API_ENDPOINT":
             return json.dumps({"error": "Search API endpoint not configured."})
        if not query:
            return json.dumps({"error": "No search query provided."})

        print(f"WebSearchTool: Searching for '{query}' (limit {num_results})")
        try:
            # Example using requests library (sync, wrap in async)
            # ** Adapt headers/params based on your chosen search API provider **
            headers = {
                # Example: Authentication might be via header
                 "Authorization": f"Bearer {self.search_api_key}",
                 "Content-Type": "application/json"
                 # Some APIs might use 'X-API-Key': self.search_api_key
            }
            params = {
                "q": query,
                "num": num_results # Parameter name might differ (e.g., 'count', 'limit')
                # Add other parameters like 'region', 'language' etc. if supported
            }

            # Using requests synchronously wrapped in asyncio.to_thread.
            # For better performance, consider using an async library like httpx.
            response = await asyncio.to_thread(
                requests.get, self.search_api_endpoint, headers=headers, params=params, timeout=10 # Add timeout
            )

            response.raise_for_status() # Raise an exception for bad status codes (4xx or 5xx)

            results = response.json() # Assuming API returns JSON

            # --- ** Adapt the result parsing based on your chosen Search API's response structure ** ---
            # Example structure assuming 'items' or 'results' list with 'title', 'link'/'url', 'snippet'
            items_list = results.get("items") or results.get("results", [])
            formatted_results = [
                {
                    "title": item.get("title", "No Title"),
                    "url": item.get("link") or item.get("url"), # Common variations
                    "snippet": item.get("snippet", "No Snippet")
                }
                for item in items_list[:num_results] # Safely get items and limit
                if (item.get("link") or item.get("url")) # Ensure there's a URL
            ]
            # --- End Adaptable Section ---

            print(f"WebSearchTool: Found {len(formatted_results)} results for '{query}'")
            return json.dumps(formatted_results)

        except requests.exceptions.Timeout:
            error_msg = f"Web search request timed out after 10 seconds."
            print(f"Error in WebSearchTool: {error_msg}")
            return json.dumps({"error": error_msg})
        except requests.exceptions.RequestException as e:
            error_msg = f"Web search request failed: {str(e)}"
            print(f"Error in WebSearchTool: {error_msg}")
            return json.dumps({"error": error_msg})
        except json.JSONDecodeError as e:
             error_msg = f"Failed to parse search API response: {str(e)}"
             print(f"Error in WebSearchTool: {error_msg}")
             return json.dumps({"error": error_msg})
        except Exception as e:
            error_msg = f"An unexpected error occurred during web search: {str(e)}"
            print(f"Error in WebSearchTool: {error_msg}")
            # import traceback
            # print(traceback.format_exc()) # Uncomment for detailed traceback
            return json.dumps({"error": error_msg})
