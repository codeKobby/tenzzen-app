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
llm_model = Gemini(model_name="gemini-2.5-pro-preview-03-25", api_key=api_key)

# Define the course generation agent
course_generator_agent = LlmAgent(
    name="CourseGeneratorAgent",
    description="Generates a structured course outline based on provided transcript and metadata.",
    model=llm_model,
    tools=[google_search],
    instruction=(
        "You are a course generator. Use the google_search tool as needed to gather additional resources. "
        "Output must be valid JSON matching the course schema: title, description, videoId, metadata, sections. "
        "Do not include any text outside the JSON object."
    ),
)

# Export root_agent for ADK CLI
root_agent = course_generator_agent