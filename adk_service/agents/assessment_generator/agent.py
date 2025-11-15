import os
from dotenv import load_dotenv, find_dotenv
from google.adk.agents import LlmAgent
from google.adk.models import Gemini
from google.adk.tools import google_search

# Load environment variables (e.g., API keys)
load_dotenv(find_dotenv())

# Retrieve API key for Gemini
api_key = os.environ.get("GOOGLE_GENERATIVE_AI_API_KEY")
if not api_key:
    raise EnvironmentError("Missing GOOGLE_GENERATIVE_AI_API_KEY in environment.")

# Initialize the Gemini model
llm_model = Gemini(model_name="gemini-2.5-pro-preview-03-25", api_key=api_key)

# Define the assessment generation agent
assessment_generator_agent = LlmAgent(
    name="AssessmentGeneratorAgent",
    description="Generates quizzes, assignments, and tests based on provided course structure.",
    model=llm_model,
    tools=[google_search],
    instruction=(
        "You are an assessment generator. Use the google_search tool to find examples or reference materials as needed. "
        "Output must be valid JSON with fields: courseTitle, assessments: [ { type, questions: [ { prompt, options?, answer } ] } ]. "
        "Do not include any explanation outside the JSON object."
    ),
)

# Export root_agent for ADK CLI
root_agent = assessment_generator_agent