import os
import json
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from dotenv import load_dotenv

# Import the agent
from .agent import root_agent

# Load environment variables
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="Tenzzen ADK Course Generation Service",
    description="Provides an API endpoint to generate courses from YouTube videos using Google ADK.",
    version="0.1.0",
)

# Add CORS middleware
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000,https://tenzzen-app.vercel.app")
origins = allowed_origins.split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request models
class GenerateRequest(BaseModel):
    video_id: str
    video_title: str
    video_description: str = ""
    transcript: str
    video_data: Dict[str, Any] = Field(default_factory=dict)

# Define health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint to verify the service is running."""
    return {"status": "healthy", "service": "Tenzzen ADK Course Generation Service"}

# Define course generation endpoint
@app.post("/generate-course")
async def generate_course(request_body: GenerateRequest):
    """
    Endpoint to generate a course from a YouTube video.
    Uses the ADK agent to generate the course content.
    """
    try:
        # Log the request
        print(f"Received request for video ID: {request_body.video_id}")
        
        # Test connection request
        if request_body.video_id == "test_connection":
            return JSONResponse(content={
                "status": "success",
                "message": "Connection test successful",
                "videoId": request_body.video_id,
                "title": request_body.video_title,
                "description": "Test connection successful",
                "metadata": {"overviewText": "This is a test response to verify connectivity."},
                "courseItems": []
            })
        
        # Create a prompt for the agent
        prompt = f"""
        Generate a structured course outline for this YouTube video:
        
        Video ID: {request_body.video_id}
        Video Title: {request_body.video_title}
        Video Description: {request_body.video_description}
        
        Use the transcript to understand the content and create a comprehensive course structure.
        """
        
        # Run the agent
        print("Running ADK agent to generate course...")
        response = await root_agent.run_async(prompt)
        
        # Process the agent's response
        if not response or not response.response:
            raise HTTPException(status_code=500, detail="Agent returned empty response")
        
        # Extract the course data from the agent's response
        try:
            # Try to parse the response as JSON
            course_data = json.loads(response.response)
        except json.JSONDecodeError:
            # If the response is not JSON, create a simple course structure
            course_data = {
                "title": request_body.video_title,
                "description": request_body.video_description,
                "videoId": request_body.video_id,
                "metadata": {
                    "overviewText": response.response[:500]  # Use the first 500 chars as overview
                },
                "courseItems": []
            }
        
        # Add the transcript to the course data
        course_data["transcript"] = request_body.transcript
        
        # Return the course data
        return JSONResponse(content=course_data)
        
    except Exception as e:
        print(f"Error generating course: {str(e)}")
        return JSONResponse(
            content={
                "error": f"Failed to generate course: {str(e)}",
                "videoId": request_body.video_id,
                "title": request_body.video_title or "Error",
                "metadata": {"overviewText": f"Error: {str(e)}"},
                "courseItems": []
            },
            status_code=500
        )

# Run the server if executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8001, reload=True)
