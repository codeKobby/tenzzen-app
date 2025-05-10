async def fetch_transcript(video_id: str) -> Optional[dict]:
    """
    Fetches the transcript for a given YouTube video ID.
    
    Returns a dictionary with:
    - text: The transcript text
    - metadata: Information about transcript quality and availability
    
    Or None if no valid transcript is available.
    """
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Try to find a manually created transcript first, then generated ones
        try:
            transcript = transcript_list.find_manually_created_transcript(['en'])
            transcript_type = "manual"
        except NoTranscriptFound:
            try:
                transcript = transcript_list.find_generated_transcript(['en'])
                transcript_type = "generated"
            except NoTranscriptFound:
                print(f"API Server Info: No English transcript found for video {video_id}")
                return None
                
        # Fetch the actual transcript segments
        transcript_segments = transcript.fetch()
        
        # Check if we have enough transcript content for analysis
        if not transcript_segments or len(transcript_segments) < 5:
            print(f"API Server Info: Transcript for {video_id} has insufficient content ({len(transcript_segments) if transcript_segments else 0} segments)")
            return None
            
        # Calculate the total transcript duration
        total_duration = sum(segment.get('duration', 0) for segment in transcript_segments)
        
        # Filter out shorts (videos under 60 seconds are likely shorts)
        if total_duration < 60:
            print(f"API Server Info: Video {video_id} appears to be a short (duration: {total_duration}s)")
            return None
        
        # Join the transcript text segments
        transcript_text = " ".join([item['text'] for item in transcript_segments])
        
        # Check if transcript text has sufficient content (at least 200 characters)
        if len(transcript_text) < 200:
            print(f"API Server Info: Transcript for {video_id} is too short ({len(transcript_text)} chars)")
            return None
            
        # Check for indicators of promotional content
        promo_indicators = [
            "subscribe to our channel",
            "hit the like button", 
            "smash that like button",
            "click the bell icon",
            "buy my course",
            "limited time offer",
            "sponsored by",
            "use code",
            "discount code",
            "click the link",
            "link in description"
        ]
        
        # If more than 15% of the transcript segments contain promotional text, reject it
        promo_segment_count = sum(1 for segment in transcript_segments 
                                 if any(indicator.lower() in segment['text'].lower() 
                                        for indicator in promo_indicators))
        if promo_segment_count > len(transcript_segments) * 0.15:
            print(f"API Server Info: Video {video_id} appears to be promotional")
            return None
            
        # Limit transcript length to avoid excessive token usage
        max_length = 15000 # Approx 3-4k tokens
        truncated_text = transcript_text[:max_length]
        
        return {
            "text": truncated_text,
            "metadata": {
                "type": transcript_type,
                "language": "en",
                "duration_seconds": total_duration,
                "segments_count": len(transcript_segments),
                "total_chars": len(transcript_text),
                "truncated": len(transcript_text) > max_length
            }
        }
    except TranscriptsDisabled:
        print(f"API Server Info: Transcripts are disabled for video {video_id}")
        return None
    except NoTranscriptFound:
        print(f"API Server Info: No English transcript found for video {video_id}")
        return None
    except Exception as e:
        print(f"API Server Error: Could not fetch transcript for {video_id}: {e}")
        return None
