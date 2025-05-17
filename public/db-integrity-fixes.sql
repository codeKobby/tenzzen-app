-- Tenzzen Database Integrity Fixes
-- This script implements missing functions and triggers to ensure data integrity

-- 1. Create the missing decrement_course_enrollment_count function
CREATE OR REPLACE FUNCTION decrement_course_enrollment_count(course_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE courses
  SET enrollment_count = GREATEST(COALESCE(enrollment_count, 0) - 1, 0)
  WHERE id = course_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Create trigger function for enrollment count management
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

-- 3. Create triggers on the enrollments table
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

-- 4. Create function to migrate course_items JSONB to normalized tables
CREATE OR REPLACE FUNCTION migrate_course_items_to_normalized_tables()
RETURNS VOID AS $$
DECLARE
  course_record RECORD;
  section_json JSONB;
  lesson_json JSONB;
  section_id UUID;
  section_index INTEGER;
  lesson_index INTEGER;
BEGIN
  -- Loop through all courses with course_items
  FOR course_record IN 
    SELECT id, course_items FROM courses 
    WHERE course_items IS NOT NULL AND course_items != 'null'::jsonb AND course_items != '[]'::jsonb
    AND NOT EXISTS (SELECT 1 FROM course_sections WHERE course_id = courses.id)
  LOOP
    -- Loop through each section in course_items
    section_index := 0;
    FOR section_json IN SELECT jsonb_array_elements(course_record.course_items)
    LOOP
      -- Insert section
      INSERT INTO course_sections (
        course_id, 
        title, 
        description, 
        order_index
      )
      VALUES (
        course_record.id,
        section_json->>'title',
        section_json->>'description',
        section_index
      )
      RETURNING id INTO section_id;
      
      -- Loop through lessons in this section
      IF section_json->'lessons' IS NOT NULL THEN
        lesson_index := 0;
        FOR lesson_json IN SELECT jsonb_array_elements(section_json->'lessons')
        LOOP
          -- Insert lesson
          INSERT INTO course_lessons (
            section_id,
            title,
            content,
            video_timestamp,
            duration,
            order_index
          )
          VALUES (
            section_id,
            lesson_json->>'title',
            lesson_json->>'content',
            (NULLIF(lesson_json->>'videoTimestamp', '')::integer),
            (NULLIF(lesson_json->>'duration', '')::integer),
            lesson_index
          );
          
          lesson_index := lesson_index + 1;
        END LOOP;
      END IF;
      
      section_index := section_index + 1;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Update RLS policies for consistency
DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;
CREATE POLICY "Users can delete their own courses" 
ON courses FOR DELETE 
TO authenticated 
USING (
  creator_id = auth.uid()::text 
  OR 
  created_by = (
    SELECT id FROM users WHERE clerk_id = auth.uid()::text
  )
);

-- 6. Create function to sync course_items with normalized tables
CREATE OR REPLACE FUNCTION sync_course_structure_to_jsonb()
RETURNS TRIGGER AS $$
DECLARE
  sections_json JSONB := '[]'::jsonb;
  lessons_json JSONB;
  section_record RECORD;
  lesson_record RECORD;
BEGIN
  -- For each section in the course
  FOR section_record IN 
    SELECT * FROM course_sections 
    WHERE course_id = NEW.course_id
    ORDER BY order_index
  LOOP
    -- Get lessons for this section
    lessons_json := '[]'::jsonb;
    FOR lesson_record IN 
      SELECT * FROM course_lessons 
      WHERE section_id = section_record.id
      ORDER BY order_index
    LOOP
      -- Add lesson to lessons array
      lessons_json := lessons_json || jsonb_build_object(
        'id', lesson_record.id,
        'title', lesson_record.title,
        'content', lesson_record.content,
        'videoTimestamp', lesson_record.video_timestamp,
        'duration', lesson_record.duration,
        'orderIndex', lesson_record.order_index
      );
    END LOOP;
    
    -- Add section with lessons to sections array
    sections_json := sections_json || jsonb_build_object(
      'id', section_record.id,
      'title', section_record.title,
      'description', section_record.description,
      'orderIndex', section_record.order_index,
      'lessons', lessons_json
    );
  END LOOP;
  
  -- Update the course_items field
  UPDATE courses
  SET course_items = sections_json
  WHERE id = NEW.course_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Create triggers to keep course_items in sync with normalized tables
DROP TRIGGER IF EXISTS section_sync_trigger ON course_sections;
CREATE TRIGGER section_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON course_sections
FOR EACH ROW
EXECUTE FUNCTION sync_course_structure_to_jsonb();

DROP TRIGGER IF EXISTS lesson_sync_trigger ON course_lessons;
CREATE TRIGGER lesson_sync_trigger
AFTER INSERT OR UPDATE OR DELETE ON course_lessons
FOR EACH ROW
EXECUTE FUNCTION sync_course_structure_to_jsonb();
