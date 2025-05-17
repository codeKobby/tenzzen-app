-- Tenzzen Learning Platform - Database Structure Improvements
-- This script enhances the existing database structure with additional tables and relationships

-- 1. Update the videos table to store complete video information
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  duration TEXT,
  channel_id TEXT,
  channel_name TEXT,
  channel_avatar TEXT,
  views TEXT,
  likes TEXT,
  publish_date TEXT,
  transcript TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update the courses table to reference videos table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS video_reference UUID REFERENCES videos(id) ON DELETE SET NULL;

-- 3. Create lesson_progress table to track detailed user progress
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  last_position INTEGER DEFAULT 0, -- Video position in seconds
  time_spent FLOAT DEFAULT 0, -- Time spent in minutes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(enrollment_id, lesson_id)
);

-- 4. Create user_notes table for note-taking functionality
CREATE TABLE IF NOT EXISTS user_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create course_resources table for additional learning materials
CREATE TABLE IF NOT EXISTS course_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  type TEXT NOT NULL, -- 'link', 'document', 'video', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create course_assessments table for quizzes and projects
CREATE TABLE IF NOT EXISTS course_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'quiz', 'project', 'assignment'
  content JSONB NOT NULL, -- Questions, options, correct answers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create assessment_submissions table for user submissions
CREATE TABLE IF NOT EXISTS assessment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES course_assessments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE NOT NULL,
  answers JSONB,
  score FLOAT,
  feedback TEXT,
  status TEXT NOT NULL, -- 'submitted', 'graded', 'pending'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enhance course_sections table with additional fields
ALTER TABLE course_sections
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS key_points JSONB,
ADD COLUMN IF NOT EXISTS assessment_type TEXT;

-- 9. Enhance course_lessons table with additional fields
ALTER TABLE course_lessons
ADD COLUMN IF NOT EXISTS key_points JSONB,
ADD COLUMN IF NOT EXISTS resources JSONB;

-- 10. Create functions for enrollment management
-- Function to increment course enrollment count
CREATE OR REPLACE FUNCTION increment_course_enrollment_count(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE courses
  SET enrollment_count = COALESCE(enrollment_count, 0) + 1
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement course enrollment count
CREATE OR REPLACE FUNCTION decrement_course_enrollment_count(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE courses
  SET enrollment_count = GREATEST(COALESCE(enrollment_count, 0) - 1, 0)
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers for enrollment management
-- Trigger function for enrollment count management
CREATE OR REPLACE FUNCTION manage_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment enrollment count
    PERFORM increment_course_enrollment_count(NEW.course_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement enrollment count
    PERFORM decrement_course_enrollment_count(OLD.course_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on the enrollments table
DROP TRIGGER IF EXISTS enrollment_insert_trigger ON enrollments;
CREATE TRIGGER enrollment_insert_trigger
AFTER INSERT ON enrollments
FOR EACH ROW
EXECUTE FUNCTION manage_course_enrollment_count();

DROP TRIGGER IF EXISTS enrollment_delete_trigger ON enrollments;
CREATE TRIGGER enrollment_delete_trigger
AFTER DELETE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION manage_course_enrollment_count();

-- 12. Create function to update user stats when enrollment status changes
CREATE OR REPLACE FUNCTION update_user_stats_on_enrollment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- For new enrollments
  IF TG_OP = 'INSERT' THEN
    -- Increment courses_in_progress
    UPDATE user_stats
    SET 
      courses_in_progress = courses_in_progress + 1,
      updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    -- Create user_stats record if it doesn't exist
    IF NOT FOUND THEN
      INSERT INTO user_stats (
        user_id, 
        courses_in_progress,
        courses_completed,
        total_learning_hours
      ) VALUES (
        NEW.user_id,
        1,
        0,
        0
      );
    END IF;
    
    RETURN NEW;
  
  -- For enrollment deletions
  ELSIF TG_OP = 'DELETE' THEN
    -- Update user stats based on completion status
    IF OLD.completion_status = 'completed' THEN
      UPDATE user_stats
      SET 
        courses_completed = GREATEST(courses_completed - 1, 0),
        updated_at = NOW()
      WHERE user_id = OLD.user_id;
    ELSE
      UPDATE user_stats
      SET 
        courses_in_progress = GREATEST(courses_in_progress - 1, 0),
        updated_at = NOW()
      WHERE user_id = OLD.user_id;
    END IF;
    
    RETURN OLD;
  
  -- For enrollment updates
  ELSIF TG_OP = 'UPDATE' THEN
    -- If status changed from in_progress to completed
    IF NEW.completion_status = 'completed' AND OLD.completion_status != 'completed' THEN
      UPDATE user_stats
      SET 
        courses_in_progress = GREATEST(courses_in_progress - 1, 0),
        courses_completed = courses_completed + 1,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    -- If status changed from completed to in_progress
    ELSIF NEW.completion_status != 'completed' AND OLD.completion_status = 'completed' THEN
      UPDATE user_stats
      SET 
        courses_in_progress = courses_in_progress + 1,
        courses_completed = GREATEST(courses_completed - 1, 0),
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user stats updates
DROP TRIGGER IF EXISTS update_user_stats_trigger ON enrollments;
CREATE TRIGGER update_user_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON enrollments
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_on_enrollment_change();
