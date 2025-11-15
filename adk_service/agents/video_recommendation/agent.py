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
print("Initialized Google AI Model: gemini-1.5-flash for video recommendation")

# Define the video recommendation agent
video_recommendation_agent = LlmAgent(
    name="VideoRecommendationAgent",
    description="Recommends educational YouTube videos based on learning goals and preferences.",
    model=llm_model,
    tools=[google_search],
    instruction=(
        "You are an expert educational content curator. Analyze learning goals and preferences to recommend "
        "the most suitable YouTube videos for effective learning. "
        "Use the google_search tool if necessary to find supplementary information about educational content. "

        "When recommending videos, consider the following factors: "
        "1. Relevance to the learning goal "
        "2. Appropriate knowledge level (beginner, intermediate, advanced) "
        "3. Video quality and educational value "
        "4. Instructor expertise and teaching style "
        "5. Content structure and organization "
        "6. Practical examples and applications "

        "For each recommended video, provide: "
        "1. A relevance score (1.0-10.0) indicating how well the video matches the learning goal "
        "2. A clear explanation of the specific benefits the learner will gain from watching the video "

        "Format the output as a valid JSON object with an array of video recommendations, each containing: "
        "videoId, title, channelName, thumbnail, duration, views, publishDate, relevanceScore, and benefit."
    ),
)

# Export root_agent for ADK CLI
root_agent = video_recommendation_agent
