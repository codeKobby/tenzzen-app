-- This SQL file creates the video_transcripts table for storing YouTube video transcripts
-- You need to run this SQL in your Supabase SQL editor

-- Create video_transcripts table
CREATE TABLE IF NOT EXISTS video_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id TEXT NOT NULL,
  language TEXT NOT NULL,
  transcript JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(video_id, language)
);

-- Enable RLS on the table
ALTER TABLE video_transcripts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Video transcripts can be viewed by anyone" ON video_transcripts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert video transcripts" ON video_transcripts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update video transcripts" ON video_transcripts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Add a comment explaining the table
COMMENT ON TABLE video_transcripts IS 'Stores cached transcripts for YouTube videos.';
