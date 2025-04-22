import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
import json
import sys
import os
import asyncio
from typing import AsyncGenerator

# Import the updated agent function
try:
    # Use absolute import when running with uvicorn from the adk_service directory
    from agent import generate_course_from_video
    print("Successfully imported generate_course_from_video from agent")
except ImportError as e:
    print(f"Error importing agent function: {e}")
    # Define a dummy function if import fails (matching the updated signature)
    async def generate_course_from_video(
        video_id: str,
        video_title: str,
        video_description: str,
        transcript: str,
        video_data: dict
    ) -> AsyncGenerator[str, None]:
        print("WARN: Using dummy generate_course_from_video function due to import error.")
        yield json.dumps({"status": "error", "message": "Agent function failed to load.", "progress": 0})
        await asyncio.sleep(0)

app = FastAPI(
    title="Tenzzen ADK Course Generation Service",
    description="Provides an API endpoint to generate courses from YouTube videos using Google ADK.",
    version="0.1.0",
)

# Updated request model to accept all necessary data again
class GenerateRequest(BaseModel):
    video_id: str
    video_title: str
    video_description: str = "" # Make description optional or provide default
    transcript: str
    video_data: dict  # Pass full video metadata

async def stream_generator(request_data: GenerateRequest) -> AsyncGenerator[str, None]:
    """Helper to wrap the agent execution and yield JSON strings for streaming."""
    video_id = request_data.video_id
    video_data = request_data.video_data  # Full metadata
    try:
        print(f"API Server Streamer: Calling ADK agent function for {video_id}...")
        # Pass all data from the request to the agent function
        async for update_str in generate_course_from_video(
            video_id=video_id,
            video_title=request_data.video_title,
            video_description=request_data.video_description,
            transcript=request_data.transcript,
            video_data=video_data
        ):
            yield f"{update_str}\n"
            await asyncio.sleep(0.05)
        print(f"API Server Streamer: Finished streaming for {video_id}")
    except Exception as e:
        print(f"API Server Streamer Error: Unhandled error during course generation for {video_id}: {e}")
        error_payload = json.dumps({"status": "error", "message": f"Internal server error during agent execution: {str(e)}", "progress": 0})
        yield f"{error_payload}\n"


@app.post("/generate-course")
async def handle_generate_course_stream(request_body: GenerateRequest):
    """
    Endpoint to trigger the ADK course generation workflow.
    Streams progress updates and the final result as JSON strings.
    Expects a JSON body with required fields (video_id, video_title, transcript, etc.)
    """
    print(f"API Server: Received streaming request for video ID: {request_body.video_id}")
    return StreamingResponse(stream_generator(request_body), media_type="application/x-ndjson")

@app.get("/health")
async def health_check():
    """Basic health check endpoint."""
    print("API Server: Health check requested.")
    return {"status": "ok", "message": "ADK service wrapper is running."}

if __name__ == "__main__":
    print("Starting Tenzzen ADK Service API server via Uvicorn...")
    script_dir_for_reload = os.path.dirname(os.path.abspath(__file__))
    uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=True, reload_dirs=[script_dir_for_reload])
