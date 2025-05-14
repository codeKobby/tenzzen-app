-- Add missing columns to the courses table
ALTER TABLE IF EXISTS courses 
ADD COLUMN IF NOT EXISTS transcript TEXT,
ADD COLUMN IF NOT EXISTS course_items JSONB DEFAULT '[]'::jsonb;

-- Comment on the new columns
COMMENT ON COLUMN courses.transcript IS 'Full transcript of the video content';
COMMENT ON COLUMN courses.course_items IS 'JSON array of course sections and lessons';

-- Create an index on the video_id column for faster lookups
CREATE INDEX IF NOT EXISTS courses_video_id_idx ON courses(video_id);
