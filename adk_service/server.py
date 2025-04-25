import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import json
import asyncio
from typing import Dict, Any

# Fix import issues by adding the project root to Python's path
# Get the absolute path of the current file's directory
current_dir = os.path.dirname(os.path.abspath(__file__))
# Get the parent directory (project root)
project_root = os.path.dirname(current_dir)
# Add project root to Python's path if not already there
if project_root not in sys.path:
    sys.path.insert(0, project_root)
    print(f"Added {project_root} to Python path")

# Import the updated agent function
try:
    # First try relative import (when running from adk_service directory)
    from agent import generate_course_from_video
    print("Successfully imported generate_course_from_video using relative import")
except ImportError as e:
    print(f"Error with relative import: {e}")
    try:
        # Try absolute import with project root now in sys.path
        from adk_service.agent import generate_course_from_video
        print("Successfully imported generate_course_from_video from adk_service.agent")
    except ImportError as e2:
        print(f"Error with absolute import: {e2}")
        # Define a dummy function if all imports fail (matching the updated signature)
        async def generate_course_from_video(
            video_id: str,
            video_title: str,
            video_description: str,
            transcript: str,
            video_data: dict
        ) -> Dict[str, Any]:
            print("WARN: Using dummy generate_course_from_video function due to import error.")
            return {
                "error": "Agent function failed to load.",
                "videoId": video_id,
                "title": video_title or "Error generating course",
                "description": "There was an error generating this course.",
                "metadata": {"overviewText": "Agent function failed to load."},
                "courseItems": []
            }

app = FastAPI(
    title="Tenzzen ADK Course Generation Service",
    description="Provides an API endpoint to generate courses from YouTube videos using Google ADK.",
    version="0.1.0",
)

# Updated request model to accept all necessary data
class GenerateRequest(BaseModel):
    video_id: str
    video_title: str
    video_description: str = "" # Make description optional or provide default
    transcript: str
    video_data: dict = Field(default_factory=dict)  # Pass full video metadata

@app.post("/generate-course")
async def handle_generate_course(request_body: GenerateRequest):
    """
    Endpoint to trigger the course generation workflow.
    Returns a complete course data structure as JSON.
    Expects a JSON body with required fields (video_id, video_title, transcript, etc.)
    """
    print(f"API Server: Received request for video ID: {request_body.video_id}")
    
    try:
        # Call the agent function with all necessary data
        course_data = await generate_course_from_video(
            video_id=request_body.video_id,
            video_title=request_body.video_title,
            video_description=request_body.video_description,
            transcript=request_body.transcript,
            video_data=request_body.video_data
        )
        
        # Log successful completion
        print(f"API Server: Successfully generated course for {request_body.video_id}")
        
        # Return the JSON response directly
        return JSONResponse(content=course_data)
        
    except Exception as e:
        print(f"API Server Error: Failed to generate course for {request_body.video_id}: {e}")
        # Return a structured error response
        error_response = {
            "error": f"Failed to generate course: {str(e)}",
            "videoId": request_body.video_id,
            "title": request_body.video_title or "Error",
            "metadata": {"overviewText": f"Error: {str(e)}"},
            "courseItems": []
        }
        return JSONResponse(content=error_response, status_code=500)

@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    print("API Server: Health check requested.")
    return {"status": "ok", "message": "ADK service wrapper is running."}

if __name__ == "__main__":
    print("Starting Tenzzen ADK Service API server via Uvicorn...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Get the folder name for proper module path
    module_name = os.path.basename(script_dir)
    # Use the properly qualified module path
    app_path = f"{module_name}.server:app" if module_name else "server:app"
    print(f"Using app path: {app_path}")
    
    uvicorn.run(
        app_path, 
        host="0.0.0.0", 
        port=8080, 
        reload=True, 
        reload_dirs=[script_dir]
    )
