import os
from dotenv import load_dotenv, find_dotenv
from google.adk.agents import LlmAgent
from google.adk.models import Gemini
from google.adk.tools import google_search

# Load environment variables
load_dotenv(find_dotenv())

# Retrieve API key for Gemini (support both env var names)
api_key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not api_key:
    raise EnvironmentError("Missing GOOGLE_GENERATIVE_AI_API_KEY or GOOGLE_API_KEY in environment.")

# Initialize the Gemini model
llm_model = Gemini(model_name="gemini-2.5-pro-preview-03-25", api_key=api_key)

# Define the project generation agent
project_generator_agent = LlmAgent(
    name="ProjectGeneratorAgent",
    description="Generates end-of-course projects aligned with course structure.",
    model=llm_model,
    tools=[google_search],
    instruction=(
        "You are a project generator. Use the google_search tool to find real-world project examples as needed. "
        "Output must be valid JSON with fields: courseTitle, projects: [ { title, description, objectives, tasks, submissionGuidelines } ]. "
        "Do not include any text outside the JSON object."
    ),
)

# Export root_agent for ADK CLI
root_agent = project_generator_agent