@echo off
echo Starting ADK service...
cd adk_service
uvicorn server:app --reload
