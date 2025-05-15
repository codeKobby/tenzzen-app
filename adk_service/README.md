# Tenzzen ADK Service

This is the ADK (Agent Development Kit) service for the Tenzzen application. It provides AI-powered course generation and video recommendation capabilities using Google's Gemini models.

## Features

- Course generation from YouTube videos using Gemini 2.5 Pro Experimental
- Video recommendations based on learning goals using Gemini 1.5 Flash
- RESTful API endpoints for integration with the Tenzzen frontend

## Local Development

### Prerequisites

- Python 3.9+
- Google Generative AI API key
- YouTube API key

### Setup

1. Create a virtual environment:

```bash
python -m venv venv
```

2. Activate the virtual environment:

```bash
# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set environment variables:

```bash
# On Windows
set GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
set YOUTUBE_API_KEY=your-api-key

# On macOS/Linux
export GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
export YOUTUBE_API_KEY=your-api-key
```

5. Run the server:

```bash
uvicorn server:app --reload
```

The server will be available at http://localhost:8001.

## API Endpoints

### Generate Course

```
POST /generate-course
```

Generates a complete course structure from a YouTube video.

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

### Recommend Videos

```
POST /recommend-videos
```

Recommends YouTube videos based on learning goals.

Request body:
```json
{
  "query": "string",
  "knowledgeLevel": "string",
  "preferredChannels": ["string"],
  "additionalContext": "string",
  "videoLength": "string"
}
```

### Health Check

```
GET /health
```

Returns the health status of the service.

## Deployment

For deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Docker

The service can be containerized using Docker:

```bash
# Build the Docker image
docker build -t tenzzen-adk-service .

# Run the container
docker run -p 8001:8001 \
  -e GOOGLE_GENERATIVE_AI_API_KEY=your-api-key \
  -e YOUTUBE_API_KEY=your-api-key \
  tenzzen-adk-service
```
