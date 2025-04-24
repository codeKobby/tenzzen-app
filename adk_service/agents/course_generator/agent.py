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
        "You are an expert course generator. Analyze the provided transcript and metadata (especially the video description) "
        "to create a comprehensive and structured course outline. "
        "Use the google_search tool if necessary to find supplementary information or clarify concepts. "
        "**Identify and extract creator resource links (affiliate, Patreon, code repos, etc.) found anywhere in the transcript or description. Also, specifically look for social media profile links (Twitter, GitHub, LinkedIn, etc.) ONLY within the provided video description metadata. Do not invent social links if they are not present in the description.** "
        "The primary output should be a `courseItems` array. This array must contain objects representing the course flow, alternating between sections and assessment placeholders where logically appropriate. "
        "Each item in `courseItems` must have a `type` field: either `'section'` or `'assessment_placeholder'`. "
        "- For `'section'` items, include `title`, `description` (optional), and `lessons` (array of objects with `title`, optional `description`, `duration`, `keyPoints`). "
        "- For `'assessment_placeholder'` items, include only the `assessmentType` field with a value of 'quiz', 'assignment', or 'test'. Determine the most suitable assessment type and placement based on the preceding section(s). **Do not generate the actual assessment content, only the placeholder.** "
        "Place these assessment placeholders *between* sections where a knowledge check or application exercise makes sense. "
        "A final 'project' assessment placeholder should be generated separately in the top-level `project` field if a concluding project is suitable for the course. "
        "Format the entire output as a single, valid JSON object matching the full schema: "
        "`{ title: string, description: string, videoId: string (optional), image: string (optional), metadata: object (with difficulty, duration, prerequisites, objectives, category, tags, sources, overviewText), courseItems: array (containing section and assessment_placeholder objects), resources: array (general supplementary resources), creatorResources: array<{title: string, url: string}>, creatorSocials: array<{platform: string, url: string}>, project: object (assessment_placeholder with type 'project', optional) }`. "
        "Ensure 'creatorResources' and 'creatorSocials' are populated if found (empty arrays otherwise). "
        "Do not include any text outside the main JSON object."
    ),
)

# Export root_agent for ADK CLI
root_agent = course_generator_agent
