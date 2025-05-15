# Tenzzen Database Architecture

This document provides a comprehensive overview of the Tenzzen learning platform's database structure, entity relationships, and key user flows.

## Database Schema Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_STATS : has
    USERS ||--o{ COURSES : creates
    USERS ||--o{ ENROLLMENTS : enrolls_in

    COURSES ||--o{ ENROLLMENTS : has

    USERS {
        uuid id PK
        text clerk_id
        text email
        text name
        text image_url
        text auth_provider
        text role
        text status
        timestamp created_at
        timestamp updated_at
    }

    USER_STATS {
        uuid id PK
        uuid user_id FK
        integer courses_completed
        integer courses_in_progress
        integer total_learning_time
        jsonb achievements
        timestamp created_at
        timestamp updated_at
    }

    COURSES {
        uuid id PK
        text title
        text subtitle
        text description
        text video_id
        text youtube_url
        text thumbnail
        boolean is_public
        uuid created_by FK
        text creator_id
        float avg_rating
        integer enrollment_count
        text status
        text difficulty_level
        interval estimated_duration
        float estimated_hours
        timestamp created_at
        timestamp updated_at
        text[] tags
        text category
        boolean featured
        float popularity
        jsonb metadata
        text generated_summary
        text transcript
        jsonb course_items
    }

    ENROLLMENTS {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        timestamp enrolled_at
        timestamp last_accessed_at
        text completion_status
        float progress
        boolean is_active
        text[] completed_lessons
        text last_lesson_id
        float total_time_spent
        text notes
        boolean reminder_enabled
        text reminder_frequency
        jsonb learning_goal
    }
```

## Key Data Relationships

### Core Learning Experience

- **Users & Courses**: Users create courses from YouTube videos, which are stored in the public catalog.
- **Users & Enrollments**: Users enroll in courses, creating an enrollment record to track progress and completion status.
- **Courses & Course Items**: Course structure (sections and lessons) is stored in the `course_items` JSONB field for flexibility.
- **Enrollments & Progress**: User progress is tracked through the enrollments table, recording completed lessons and overall progress.

### Content Organization

- **Courses & Categories**: Courses have a primary category for organization and discovery.
- **Courses & Tags**: Courses have multiple tags (stored as an array) for enhanced searchability.
- **Courses & Transcripts**: Course transcripts are stored directly in the courses table for content analysis and searchability.

### User Experience & Engagement

- **User Stats**: Aggregate metrics about a user's learning activity, including courses completed and total learning time.
- **Course Visibility**: Courses are public by default, allowing all users to discover and enroll in them.
- **Course Enrollment**: Users can enroll in any public course, creating a private enrollment record to track their progress.

## Key User Flows

### Course Generation Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Routes
    participant ADK as ADK Service
    participant DB as Supabase

    User->>UI: Enters YouTube URL
    UI->>API: Sends video URL for analysis
    API->>ADK: Requests content processing
    ADK->>ADK: Extracts transcript and analyzes content
    ADK->>ADK: Generates course structure
    ADK->>API: Returns course data
    API->>DB: Stores course in public catalog
    API->>UI: Returns course details
    UI->>User: Displays generated course
```

### Course Enrollment Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Routes
    participant DB as Supabase

    User->>UI: Clicks "Enroll" on course
    UI->>API: Calls /api/supabase/courses/enroll
    API->>DB: Checks for existing enrollment
    alt New Enrollment
        API->>DB: Creates new enrollment record
        API->>DB: Triggers increment_course_enrollment_count
        API->>DB: Updates user stats
    else Already Enrolled
        API->>DB: Updates last accessed timestamp
    end
    API->>UI: Returns enrollment status
    UI->>User: Redirects to courses page
```

### Learning Progress Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as API Routes
    participant DB as Supabase

    User->>UI: Completes lesson
    UI->>API: Calls /api/supabase/courses/progress
    API->>DB: Updates enrollment progress
    API->>DB: Adds completed lesson to list
    API->>DB: Updates user statistics

    alt Course Completed
        API->>DB: Marks course as completed
        API->>DB: Updates completion metrics
    end

    API->>UI: Returns updated progress
    UI->>User: Shows progress indicators
```

### Explore Courses Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Supabase Client
    participant DB as Supabase

    User->>UI: Visits explore page
    UI->>API: Queries public courses
    API->>DB: Fetches courses with is_public=true

    alt With Category Filter
        API->>DB: Applies category filter
    end

    alt With Search Query
        API->>DB: Applies search filter
    end

    DB->>API: Returns filtered courses
    API->>UI: Formats course data
    UI->>User: Displays course catalog
```

### User Courses Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Supabase Client
    participant DB as Supabase

    User->>UI: Visits courses page
    UI->>API: Queries user enrollments
    API->>DB: Fetches enrollments with course data

    alt With Category Filter
        API->>DB: Applies category filter
    end

    DB->>API: Returns user's enrolled courses
    API->>UI: Formats course data
    UI->>User: Displays user's courses
```

## Database Indexing Strategy

The database schema includes strategic indexes to optimize common query patterns:

1. **User-Based Queries**
   - Index on `enrollments.user_id` for quick retrieval of user-specific enrollments
   - Index on `courses.created_by` for finding courses created by a specific user

2. **Course Discovery**
   - Index on `courses.is_public` for exploring available courses
   - Index on `courses.category` for filtering by category
   - Full-text search index on course titles using `to_tsvector` for enhanced search performance
   - Index on `courses.video_id` for quick lookups when checking for existing courses

3. **Time-Based Queries**
   - Index on `courses.created_at` for chronological sorting
   - Index on `enrollments.last_accessed_at` for sorting by recent activity

4. **Performance Optimization**
   - Index on `courses.popularity` for sorting trending courses
   - Compound indexes for common filter combinations

## Row Level Security (RLS)

Tenzzen implements Row Level Security to ensure data privacy and access control:

1. **Courses Table Policies**
   - "Public courses are viewable by everyone" - Allows anyone to view courses with `is_public = true`
   - "Users can view their enrolled courses" - Users can view courses they're enrolled in, even if not public
   - "Users can create courses" - Authenticated users can create new courses
   - "Users can update their own courses" - Users can only update courses they created
   - "Users can delete their own courses" - Users can only delete courses they created

2. **Enrollments Table Policies**
   - "Users can view their own enrollments" - Users can only view their own enrollment records
   - "Users can insert their own enrollments" - Users can only create enrollments for themselves
   - "Users can update their own enrollments" - Users can only update their own enrollment records
   - "Users can delete their own enrollments" - Users can only delete their own enrollment records

## Database Functions and Triggers

The database includes several functions and triggers to maintain data consistency:

1. **User Identification**
   - `get_user_id_from_clerk_id(clerk_id TEXT)` - Converts a Clerk ID to a Supabase user UUID
   - `get_user_id_from_auth_id()` - Gets the current user's UUID from their auth context

2. **Enrollment Management**
   - `increment_course_enrollment_count(course_id UUID)` - Increments a course's enrollment count
   - `decrement_course_enrollment_count(course_id UUID)` - Decrements a course's enrollment count
   - `update_course_enrollment_count()` - Trigger function that automatically updates enrollment counts

## Type System

The database implements a consistent type system for data handling:

- **CourseStatus**: "draft" | "published" | "archived" | "generating" | "failed"
- **CompletionStatus**: "not_started" | "in_progress" | "completed"
- **DifficultyLevel**: "beginner" | "intermediate" | "advanced" | "expert"

## Future Enhancements

As the platform grows, consider these potential enhancements:

1. **Normalized Course Structure**
   - Create dedicated tables for course sections and lessons
   - This would allow for more efficient querying and updating of specific lessons

2. **Dedicated Categories and Tags Tables**
   - Create separate tables for categories and tags
   - Implement many-to-many relationships for better organization

3. **Course Ratings System**
   - Add a dedicated table for course ratings and reviews
   - Implement triggers to maintain the `avg_rating` field in the courses table

4. **Enhanced Analytics**
   - Add more detailed tracking of user learning activities
   - Implement advanced analytics dashboards
