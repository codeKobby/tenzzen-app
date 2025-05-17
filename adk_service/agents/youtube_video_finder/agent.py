import os
from dotenv import load_dotenv, find_dotenv
from google.adk.agents import LlmAgent
from google.adk.models import Gemini
from google.adk.tools import google_search

# Load both project root and local .env
load_dotenv(find_dotenv())
load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env'))
load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

api_key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise EnvironmentError("Missing GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_API_KEY in environment.")

# Initialize the Gemini model
llm_model = Gemini(model_name="gemini-1.5-flash", api_key=api_key)

# Define the YouTube video finder agent
youtube_video_finder_agent = LlmAgent(
    name="YouTubeVideoFinderAgent",
    description="Finds relevant YouTube videos based on search criteria and learning goals.",
    model=llm_model,
    tools=[google_search],
    instruction=(
        "You are an expert YouTube video finder. Your task is to help users find the most relevant "
        "educational videos on YouTube based on their learning goals and preferences. "
        "Use the google_search tool to find information about educational videos on YouTube. "
        
        "When searching for videos, consider the following factors: "
        "1. Relevance to the search query or learning goal "
        "2. Video quality and production value "
        "3. Instructor expertise and teaching style "
        "4. Content structure and organization "
        "5. User engagement metrics (views, likes, comments) "
        "6. Recency and currency of information "
        
        "For each video you find, provide: "
        "1. The video ID (extracted from the YouTube URL) "
        "2. The video title "
        "3. The channel name "
        "4. A brief description of what the user will learn from the video "
        "5. Why this video is particularly relevant to the user's query "
        
        "Format your response as a valid JSON array of video objects, each containing: "
        "videoId, title, channelName, description, and relevance."
    ),
)

# Export root_agent for ADK CLI
root_agent = youtube_video_finder_agent
