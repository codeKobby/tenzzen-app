-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'clerk',
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login JSONB
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  bio TEXT,
  timezone TEXT,
  language TEXT,
  preferences JSONB,
  learning_preferences JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_stats table
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  total_learning_hours FLOAT DEFAULT 0,
  courses_completed INTEGER DEFAULT 0,
  courses_in_progress INTEGER DEFAULT 0,
  assessments_completed INTEGER DEFAULT 0,
  projects_submitted INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  weekly_activity INTEGER[] DEFAULT ARRAY[0, 0, 0, 0, 0, 0, 0]
);

-- Create courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  video_id TEXT,
  youtube_url TEXT,
  thumbnail TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  creator_id TEXT, -- For backward compatibility with Convex data
  avg_rating FLOAT,
  enrollment_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  difficulty_level TEXT DEFAULT 'beginner',
  estimated_duration INTERVAL,
  estimated_hours FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tags TEXT[],
  category TEXT,
  featured BOOLEAN DEFAULT false,
  popularity FLOAT DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb, -- For storing additional data like overview, sections, etc.
  generated_summary TEXT
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  course_id UUID REFERENCES courses(id) NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_status TEXT DEFAULT 'in_progress',
  progress FLOAT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  completed_lessons TEXT[], -- Store IDs of completed lessons
  last_lesson_id TEXT,
  total_time_spent FLOAT DEFAULT 0, -- In minutes
  notes TEXT,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_frequency TEXT,
  learning_goal JSONB,
  UNIQUE(user_id, course_id)
);

-- Create course_sections table
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_lessons table
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES course_sections(id) NOT NULL,
  course_id UUID REFERENCES courses(id) NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL,
  duration INTERVAL,
  transcript TEXT,
  ai_generated_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create course_ratings table
CREATE TABLE IF NOT EXISTS course_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  course_id UUID REFERENCES courses(id) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  helpful_count INTEGER DEFAULT 0,
  reported BOOLEAN DEFAULT false,
  verified BOOLEAN DEFAULT false,
  UNIQUE(user_id, course_id)
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users table policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- User profiles table policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

-- User stats table policies
CREATE POLICY "Users can view their own stats" ON user_stats
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

CREATE POLICY "Users can update their own stats" ON user_stats
  FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
  );

-- Courses table policies
CREATE POLICY "Public courses can be viewed by anyone" ON courses
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own courses" ON courses
  FOR SELECT USING (created_by IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update their own courses" ON courses
  FOR UPDATE USING (created_by IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete their own courses" ON courses
  FOR DELETE USING (created_by IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert their own courses" ON courses
  FOR INSERT WITH CHECK (created_by IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Enrollments table policies
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can update their own enrollments" ON enrollments
  FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can delete their own enrollments" ON enrollments
  FOR DELETE USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

CREATE POLICY "Users can insert their own enrollments" ON enrollments
  FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));

-- Course sections table policies
CREATE POLICY "Public course sections can be viewed by anyone" ON course_sections
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE is_public = true)
  );

CREATE POLICY "Users can view sections of enrolled courses" ON course_sections
  FOR SELECT USING (
    course_id IN (
      SELECT course_id FROM enrollments
      WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Course creators can manage their course sections" ON course_sections
  FOR ALL USING (
    course_id IN (
      SELECT id FROM courses
      WHERE created_by IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
    )
  );

-- Course lessons table policies
CREATE POLICY "Public course lessons can be viewed by anyone" ON course_lessons
  FOR SELECT USING (
    course_id IN (SELECT id FROM courses WHERE is_public = true)
  );

CREATE POLICY "Users can view lessons of enrolled courses" ON course_lessons
  FOR SELECT USING (
    course_id IN (
      SELECT course_id FROM enrollments
      WHERE user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "Course creators can manage their course lessons" ON course_lessons
  FOR ALL USING (
    course_id IN (
      SELECT id FROM courses
      WHERE created_by IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub')
    )
  );

-- Course ratings table policies
CREATE POLICY "Ratings can be viewed by anyone" ON course_ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own ratings" ON course_ratings
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'));
