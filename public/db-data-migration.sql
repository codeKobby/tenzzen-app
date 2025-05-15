-- Tenzzen Data Migration Script
-- This script migrates data from the existing structure to the new normalized tables

-- 1. Migrate Categories from courses.category field
DO $$
DECLARE
    category_record RECORD;
    category_id UUID;
    existing_categories TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Get distinct categories from courses table
    FOR category_record IN 
        SELECT DISTINCT category FROM courses 
        WHERE category IS NOT NULL AND category != ''
    LOOP
        -- Check if category already exists
        SELECT id INTO category_id FROM categories WHERE name = category_record.category;
        
        IF category_id IS NULL THEN
            -- Insert new category
            INSERT INTO categories (name, description, slug)
            VALUES (
                category_record.category,
                'Auto-generated category from courses table',
                lower(regexp_replace(category_record.category, '[^a-zA-Z0-9]', '-', 'g'))
            )
            RETURNING id INTO category_id;
            
            -- Add to existing categories array
            existing_categories := array_append(existing_categories, category_record.category);
        END IF;
        
        -- Create course-category relationships
        INSERT INTO course_categories (course_id, category_id)
        SELECT id, category_id
        FROM courses
        WHERE category = category_record.category
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Migrated categories: %', existing_categories;
END $$;

-- 2. Migrate Tags from courses.tags array
DO $$
DECLARE
    course_record RECORD;
    tag_name TEXT;
    tag_id UUID;
BEGIN
    -- Loop through all courses with tags
    FOR course_record IN 
        SELECT id, tags FROM courses 
        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
    LOOP
        -- Loop through each tag in the array
        FOREACH tag_name IN ARRAY course_record.tags
        LOOP
            -- Check if tag already exists
            SELECT id INTO tag_id FROM tags WHERE name = tag_name;
            
            IF tag_id IS NULL THEN
                -- Insert new tag
                INSERT INTO tags (name)
                VALUES (tag_name)
                RETURNING id INTO tag_id;
            END IF;
            
            -- Create course-tag relationship
            INSERT INTO course_tags (course_id, tag_id)
            VALUES (course_record.id, tag_id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 3. Migrate Course Sections and Lessons from course_items JSONB
DO $$
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
            
            -- Loop through each lesson in the section
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
                    (lesson_json->>'videoTimestamp')::integer,
                    (lesson_json->>'duration')::integer,
                    lesson_index
                );
                
                lesson_index := lesson_index + 1;
            END LOOP;
            
            section_index := section_index + 1;
        END LOOP;
    END LOOP;
END $$;

-- 4. Update course_count in categories table
UPDATE categories c
SET course_count = (
    SELECT COUNT(*) 
    FROM course_categories cc 
    WHERE cc.category_id = c.id
);

-- 5. Update use_count in tags table
UPDATE tags t
SET use_count = (
    SELECT COUNT(*) 
    FROM course_tags ct 
    WHERE ct.tag_id = t.id
);
