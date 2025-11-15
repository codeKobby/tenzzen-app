-- Tenzzen Database Improvements
-- This script implements recommended improvements to the database structure

-- 1. Standardize User Identification
-- Create a function to get UUID from Clerk ID
CREATE OR REPLACE FUNCTION get_user_id_from_clerk_id(clerk_id TEXT)
RETURNS UUID AS $$
  SELECT id FROM users WHERE clerk_id = $1 LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Create a function to get current user's UUID from auth.uid()
CREATE OR REPLACE FUNCTION get_user_id_from_auth_id()
RETURNS UUID AS $$
  SELECT get_user_id_from_clerk_id(auth.uid()::text);
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Improve Data Consistency
-- Create a function to increment course enrollment count
CREATE OR REPLACE FUNCTION increment_course_enrollment_count(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE courses SET enrollment_count = COALESCE(enrollment_count, 0) + 1 WHERE id = course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to decrement course enrollment count
CREATE OR REPLACE FUNCTION decrement_course_enrollment_count(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE courses SET enrollment_count = GREATEST(COALESCE(enrollment_count, 0) - 1, 0) WHERE id = course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically update enrollment count
CREATE OR REPLACE FUNCTION update_course_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE courses SET enrollment_count = COALESCE(enrollment_count, 0) + 1 WHERE id = NEW.course_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE courses SET enrollment_count = GREATEST(COALESCE(enrollment_count, 0) - 1, 0) WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS enrollment_count_trigger ON enrollments;

-- Create the trigger
CREATE TRIGGER enrollment_count_trigger
AFTER INSERT OR DELETE ON enrollments
FOR EACH ROW EXECUTE FUNCTION update_course_enrollment_count();

-- 3. Add Appropriate Indexes
-- Add index for course title search
CREATE INDEX IF NOT EXISTS courses_title_idx ON courses USING gin (to_tsvector('english', title));

-- Add index for course category
CREATE INDEX IF NOT EXISTS courses_category_idx ON courses(category);

-- Add index for course creation date
CREATE INDEX IF NOT EXISTS courses_created_at_idx ON courses(created_at);

-- Add index for course popularity
CREATE INDEX IF NOT EXISTS courses_popularity_idx ON courses(popularity DESC);

-- Add index for enrollment last accessed date
CREATE INDEX IF NOT EXISTS enrollments_last_accessed_idx ON enrollments(last_accessed_at DESC);

-- 4. Enhance RLS Policies
-- Update RLS policies for courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow service role full access to courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can create courses" ON courses;
DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
DROP POLICY IF EXISTS "Users can view their enrolled courses" ON courses;

-- Recreate policies with improved security
-- Public courses are viewable by everyone
CREATE POLICY "Public courses are viewable by everyone" ON courses
FOR SELECT USING (is_public = true);

-- Users can view all their enrolled courses, even if not public
CREATE POLICY "Users can view their enrolled courses" ON courses
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    WHERE enrollments.course_id = courses.id
    AND enrollments.user_id = get_user_id_from_auth_id()
  )
);

-- Users can create courses
CREATE POLICY "Users can create courses" ON courses
FOR INSERT WITH CHECK (true);

-- Users can update their own courses
CREATE POLICY "Users can update their own courses" ON courses
FOR UPDATE USING (created_by = get_user_id_from_auth_id())
WITH CHECK (created_by = get_user_id_from_auth_id());

-- Users can delete their own courses
CREATE POLICY "Users can delete their own courses" ON courses
FOR DELETE USING (created_by = get_user_id_from_auth_id());

-- Service role has full access
CREATE POLICY "Allow service role full access to courses" ON courses
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Update RLS policies for enrollments table
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow service role full access to enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can delete their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;

-- Recreate policies with improved security
-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON enrollments
FOR SELECT USING (user_id = get_user_id_from_auth_id());

-- Users can insert their own enrollments
CREATE POLICY "Users can insert their own enrollments" ON enrollments
FOR INSERT WITH CHECK (user_id = get_user_id_from_auth_id());

-- Users can update their own enrollments
CREATE POLICY "Users can update their own enrollments" ON enrollments
FOR UPDATE USING (user_id = get_user_id_from_auth_id())
WITH CHECK (user_id = get_user_id_from_auth_id());

-- Users can delete their own enrollments
CREATE POLICY "Users can delete their own enrollments" ON enrollments
FOR DELETE USING (user_id = get_user_id_from_auth_id());

-- Service role has full access
CREATE POLICY "Allow service role full access to enrollments" ON enrollments
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
