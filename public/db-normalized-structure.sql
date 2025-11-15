-- Tenzzen Database Normalization
-- This script implements the normalized course structure and categories/tags tables

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  slug TEXT UNIQUE,
  course_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Course-Categories Junction Table
CREATE TABLE IF NOT EXISTS course_categories (
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, category_id)
);

-- 4. Create Course-Tags Junction Table
CREATE TABLE IF NOT EXISTS course_tags (
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (course_id, tag_id)
);

-- 5. Create Course Sections Table
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Course Lessons Table
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_timestamp INTEGER, -- in seconds
  duration INTEGER, -- in seconds
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_section_id ON course_lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_course_categories_course_id ON course_categories(course_id);
CREATE INDEX IF NOT EXISTS idx_course_categories_category_id ON course_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_course_tags_course_id ON course_tags(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tags_tag_id ON course_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- 8. Create RLS Policies for New Tables
-- Categories table policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone" ON categories
FOR SELECT USING (true);

CREATE POLICY "Service role can manage categories" ON categories
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Tags table policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone" ON tags
FOR SELECT USING (true);

CREATE POLICY "Service role can manage tags" ON tags
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Course-Categories junction table policies
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course categories are viewable by everyone" ON course_categories
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_categories.course_id
    AND courses.is_public = true
  )
);

CREATE POLICY "Service role can manage course categories" ON course_categories
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Course-Tags junction table policies
ALTER TABLE course_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Course tags are viewable by everyone" ON course_tags
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_tags.course_id
    AND courses.is_public = true
  )
);

CREATE POLICY "Service role can manage course tags" ON course_tags
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Course Sections table policies
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public course sections are viewable by everyone" ON course_sections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_sections.course_id
    AND courses.is_public = true
  )
);

CREATE POLICY "Users can view their enrolled course sections" ON course_sections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM enrollments
    JOIN courses ON enrollments.course_id = courses.id
    WHERE courses.id = course_sections.course_id
    AND enrollments.user_id = get_user_id_from_auth_id()
  )
);

CREATE POLICY "Service role can manage course sections" ON course_sections
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Course Lessons table policies
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public course lessons are viewable by everyone" ON course_lessons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_sections
    JOIN courses ON course_sections.course_id = courses.id
    WHERE course_sections.id = course_lessons.section_id
    AND courses.is_public = true
  )
);

CREATE POLICY "Users can view their enrolled course lessons" ON course_lessons
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM course_sections
    JOIN courses ON course_sections.course_id = courses.id
    JOIN enrollments ON enrollments.course_id = courses.id
    WHERE course_sections.id = course_lessons.section_id
    AND enrollments.user_id = get_user_id_from_auth_id()
  )
);

CREATE POLICY "Service role can manage course lessons" ON course_lessons
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 9. Create Functions for Data Migration and Maintenance
-- Function to update category course count
CREATE OR REPLACE FUNCTION update_category_course_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE categories SET course_count = course_count + 1 WHERE id = NEW.category_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE categories SET course_count = course_count - 1 WHERE id = OLD.category_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for category course count
CREATE TRIGGER update_category_course_count_trigger
AFTER INSERT OR DELETE ON course_categories
FOR EACH ROW EXECUTE FUNCTION update_category_course_count();

-- Function to update tag use count
CREATE OR REPLACE FUNCTION update_tag_use_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET use_count = use_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET use_count = use_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tag use count
CREATE TRIGGER update_tag_use_count_trigger
AFTER INSERT OR DELETE ON course_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_use_count();

-- Function to generate slug from category name
CREATE OR REPLACE FUNCTION generate_category_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]', '-', 'g'));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for category slug generation
CREATE TRIGGER generate_category_slug_trigger
BEFORE INSERT OR UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION generate_category_slug();
