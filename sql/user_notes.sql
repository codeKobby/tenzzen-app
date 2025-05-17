-- Alter user_notes table to add new fields for note-taking functionality
ALTER TABLE user_notes
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'personal',
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS starred BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS user_notes_user_id_idx ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS user_notes_course_id_idx ON user_notes(course_id);
CREATE INDEX IF NOT EXISTS user_notes_lesson_id_idx ON user_notes(lesson_id);
CREATE INDEX IF NOT EXISTS user_notes_category_idx ON user_notes(category);
CREATE INDEX IF NOT EXISTS user_notes_starred_idx ON user_notes(starred);

-- Enable Row Level Security
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

-- Create policy to ensure users can only access their own notes
CREATE POLICY "Users can only access their own notes" ON user_notes
  FOR ALL USING (auth.uid() = user_id);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER update_user_notes_updated_at
  BEFORE UPDATE ON user_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
