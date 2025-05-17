import os
import json
import re
import asyncio
from typing import Dict, Any, List
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.tools import Tool
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

# Load environment variables
load_dotenv()

# Define tools for the agent
class YouTubeTranscriptTool(Tool):
    def __init__(self):
        super().__init__(
            name="YouTubeTranscriptTool",
            description="Fetches the transcript for a given YouTube video ID. Returns the transcript as text.",
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

# Create the agent
root_agent = Agent(
    model="gemini-1.5-flash",
    name="course_generation_agent",
    description="Agent that generates course content from YouTube videos",
    instruction="""
    You are an expert AI assistant that generates structured course outlines from YouTube videos.
    
    When given a YouTube video ID, you will:
    1. Fetch the transcript using the YouTubeTranscriptTool
    2. Analyze the transcript to understand the content
    3. Create a structured course outline with sections and lessons
    4. Return the course outline in a clear, organized format
    
    Be thorough, accurate, and helpful in your responses.
    """,
    tools=[YouTubeTranscriptTool()],
)

# This is the entry point for the ADK CLI
if __name__ == "__main__":
    from google.adk.run import run_agent
    run_agent(root_agent)
