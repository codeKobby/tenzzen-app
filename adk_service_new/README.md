# Tenzzen ADK Course Generation Service

This service uses Google's Agent Development Kit (ADK) to generate course content from YouTube videos.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   ```

2. Activate the virtual environment:
   ```bash
   # On Windows
   .venv\Scripts\activate
   
   # On macOS/Linux
   source .venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Google API key and YouTube API key

## Running the Service

### Using ADK CLI

To run the agent using the ADK CLI:

```bash
cd adk_service_new
adk run .
```

### Using FastAPI Server

To run the FastAPI server:

```bash
cd adk_service_new
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

## API Endpoints

### Health Check

```
GET /health
```

Returns the health status of the service.

### Generate Course

```
POST /generate-course
```

Generates a course from a YouTube video.

Request body:
```json
{
  "video_id": "string",
  "video_title": "string",
  "video_description": "string",
  "transcript": "string",
  "video_data": {}
}
```

## Testing

To test the connection:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"video_id":"test_connection","video_title":"Test Connection","video_description":"Testing connection to ADK service","transcript":"This is a test transcript","video_data":{}}' http://localhost:8001/generate-course
```
