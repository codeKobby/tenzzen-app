-- Add standardized duration and lesson count fields to the courses table
ALTER TABLE IF EXISTS courses 
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS total_lessons INTEGER DEFAULT 0;

-- Comment on the new columns
COMMENT ON COLUMN courses.duration_seconds IS 'Total duration in seconds for consistent duration handling';
COMMENT ON COLUMN courses.total_lessons IS 'Total number of lessons in the course for consistent lesson count display';

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS courses_duration_seconds_idx ON courses(duration_seconds);
CREATE INDEX IF NOT EXISTS courses_total_lessons_idx ON courses(total_lessons);

-- Populate the new fields from existing data
UPDATE courses
SET 
  -- Convert estimated_hours to seconds if available
  duration_seconds = CASE 
    WHEN estimated_hours IS NOT NULL THEN (estimated_hours * 3600)::INTEGER
    WHEN estimated_duration IS NOT NULL THEN 
      -- Try to extract seconds from interval
      EXTRACT(EPOCH FROM estimated_duration)::INTEGER
    ELSE NULL
  END,
  -- Calculate total lessons from course_items JSON
  total_lessons = (
    SELECT COALESCE(SUM(jsonb_array_length(section->'lessons')), 0)::INTEGER
    FROM jsonb_array_elements(CASE 
      WHEN course_items IS NOT NULL AND course_items != 'null'::jsonb AND course_items != '[]'::jsonb 
      THEN course_items 
      ELSE '[]'::jsonb 
    END) AS section
    WHERE section ? 'lessons'
  )
WHERE duration_seconds IS NULL OR total_lessons = 0;
