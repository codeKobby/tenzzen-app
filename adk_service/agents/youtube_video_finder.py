"""
AI Video Finder Agent for Tenzzen
- Accepts user input (topic, knowledge level, preferred channels, additional context, preferred video length)
- Constructs a YouTube search query and applies filters
- Fetches results, extracts video details, and rates relevance
- Returns a list of videos with: title, channel, duration, thumbnail, relevance score, and a short benefit/learning order summary
"""

from typing import List, Dict, Any
# Placeholder for actual YouTube API client import (e.g., youtube.js via node or a Python wrapper)
# from youtube_api_client import search_youtube_videos

def map_length_to_seconds(length: str) -> (int, int):
    """Map user-friendly video length to a (min, max) seconds tuple."""
    if length == "Short (< 30 min)":
        return (0, 1800)
    elif length == "Medium (30 min – 2 hr)":
        return (1800, 7200)
    elif length == "Long (> 2 hr)":
        return (7200, 100000)
    return (0, 100000)

def build_search_query(topic: str, knowledge_level: str, channels: List[str], context: str) -> str:
    query = topic
    if knowledge_level:
        query += f" {knowledge_level} tutorial"
    if context:
        query += f" {context}"
    if channels:
        query += " " + " ".join([f"channel:{c}" for c in channels])
    return query

def rate_relevance(video: Dict[str, Any], query: str) -> float:
    """Simple relevance rating based on query match in title/description."""
    score = 0
    title = video.get('title', '').lower()
    desc = video.get('description', '').lower()
    if query.lower() in title:
        score += 2
    if query.lower() in desc:
        score += 1
    score += video.get('view_count', 0) / 1e6  # Bonus for popularity
    return score

def summarize_benefit(video: Dict[str, Any]) -> str:
    """Generate a short benefit/learning order summary for the video."""
    # Placeholder: In production, use NLP or LLM for better summaries
    return f"Covers: {video.get('title', '')[:60]}... by {video.get('channel', '')}"

def find_relevant_youtube_videos(
    topic: str,
    knowledge_level: str = "",
    preferred_channels: List[str] = None,
    additional_context: str = "",
    video_length: str = "Any"
) -> List[Dict[str, Any]]:
    """
    Main agent entry point. Returns a list of relevant YouTube videos for the user's learning goal.
    """
    if preferred_channels is None:
        preferred_channels = []
    query = build_search_query(topic, knowledge_level, preferred_channels, additional_context)
    min_len, max_len = map_length_to_seconds(video_length)

    # Placeholder: Replace with actual YouTube API call
    # videos = search_youtube_videos(query, min_duration=min_len, max_duration=max_len, language="en")
    videos = []  # Fetched from YouTube API

    # Filter and rate videos
    filtered = []
    for v in videos:
        duration = v.get('duration', 0)
        if min_len <= duration <= max_len:
            v['relevance'] = rate_relevance(v, query)
            v['benefit'] = summarize_benefit(v)
            filtered.append(v)
    # Sort by relevance
    filtered.sort(key=lambda x: x['relevance'], reverse=True)
    # Return top 10
    return filtered[:10]
