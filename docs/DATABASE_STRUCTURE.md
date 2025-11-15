# Tenzzen Database Structure

This document provides a comprehensive overview of the Tenzzen learning platform's database structure, entity relationships, and key data flows. This structure has been fully implemented and is currently active in the application.

## Database Schema Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_PROFILES : has
    USERS ||--o{ USER_STATS : has
    USERS ||--o{ ENROLLMENTS : enrolls_in
    USERS ||--o{ USER_NOTES : creates

    VIDEOS ||--o{ COURSES : source_for

    COURSES ||--o{ COURSE_SECTIONS : contains
    COURSES ||--o{ ENROLLMENTS : has
    COURSES ||--o{ COURSE_RESOURCES : includes
    COURSES ||--o{ COURSE_ASSESSMENTS : includes
    COURSES }o--o{ CATEGORIES : belongs_to
    COURSES }o--o{ TAGS : has

    COURSE_SECTIONS ||--o{ COURSE_LESSONS : contains
    COURSE_SECTIONS ||--o{ COURSE_ASSESSMENTS : associated_with

    ENROLLMENTS ||--o{ LESSON_PROGRESS : tracks
    ENROLLMENTS ||--o{ ASSESSMENT_SUBMISSIONS : includes

    COURSE_ASSESSMENTS ||--o{ ASSESSMENT_SUBMISSIONS : receives

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
        jsonb last_login
    }

    USER_PROFILES {
        uuid id PK
        uuid user_id FK
        text bio
        text timezone
        text language
        jsonb preferences
        jsonb learning_preferences
        timestamp updated_at
    }

    USER_STATS {
        uuid id PK
        uuid user_id FK
        float total_learning_hours
        integer courses_completed
        integer courses_in_progress
        integer assessments_completed
        integer projects_submitted
        timestamp last_active_at
        integer streak_days
        integer longest_streak
        integer total_points
        integer[] weekly_activity
        timestamp created_at
        timestamp updated_at
    }

    VIDEOS {
        uuid id PK
        text youtube_id
        text title
        text description
        text thumbnail
        text duration
        text channel_id
        text channel_name
        text channel_avatar
        text views
        text likes
        text publish_date
        text transcript
        timestamp created_at
        timestamp updated_at
    }

    CATEGORIES {
        uuid id PK
        text name
        text description
        text icon
        text color
        text slug
        integer course_count
        timestamp created_at
        timestamp updated_at
    }

    TAGS {
        uuid id PK
        text name
        integer use_count
        timestamp created_at
    }

    COURSES {
        uuid id PK
        text title
        text subtitle
        text description
        uuid video_reference FK
        text youtube_id
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
        boolean featured
        float popularity
        jsonb metadata
        text generated_summary
    }

    COURSE_SECTIONS {
        uuid id PK
        uuid course_id FK
        text title
        text description
        integer order_index
        text objective
        jsonb key_points
        text assessment_type
        timestamp created_at
        timestamp updated_at
    }

    COURSE_LESSONS {
        uuid id PK
        uuid section_id FK
        text title
        text content
        integer video_timestamp
        integer duration
        integer order_index
        jsonb key_points
        jsonb resources
        timestamp created_at
        timestamp updated_at
    }

    COURSE_CATEGORIES {
        uuid id PK
        uuid course_id FK
        uuid category_id FK
        timestamp created_at
    }

    COURSE_TAGS {
        uuid id PK
        uuid course_id FK
        uuid tag_id FK
        timestamp created_at
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
        uuid[] completed_lessons
        uuid last_lesson_id
        float total_time_spent
        text notes
        boolean reminder_enabled
        text reminder_frequency
        jsonb learning_goal
    }

    LESSON_PROGRESS {
        uuid id PK
        uuid enrollment_id FK
        uuid lesson_id FK
        boolean completed
        integer last_position
        float time_spent
        text notes
        timestamp created_at
        timestamp updated_at
    }

    USER_NOTES {
        uuid id PK
        uuid user_id FK
        uuid course_id FK
        uuid lesson_id FK
        text title
        text content
        timestamp created_at
        timestamp updated_at
    }

    COURSE_RESOURCES {
        uuid id PK
        uuid course_id FK
        text title
        text description
        text url
        text type
        timestamp created_at
        timestamp updated_at
    }

    COURSE_ASSESSMENTS {
        uuid id PK
        uuid course_id FK
        uuid section_id FK
        text title
        text description
        text type
        jsonb content
        timestamp created_at
        timestamp updated_at
    }

    ASSESSMENT_SUBMISSIONS {
        uuid id PK
        uuid assessment_id FK
        uuid user_id FK
        uuid enrollment_id FK
        jsonb answers
        float score
        text feedback
        text status
        timestamp created_at
        timestamp updated_at
    }
```

## Core Entity Relationships

### Content Organization

- **Videos**: Store YouTube video metadata and transcripts
- **Courses**: Structured learning experiences built from videos
- **Course Sections**: Major divisions within a course
- **Course Lessons**: Individual learning units within sections
- **Categories & Tags**: Classification system for courses

### User Management

- **Users**: Core identity information linked with Clerk authentication
- **User Profiles**: Extended user information and preferences
- **User Stats**: Learning metrics and achievements

### Learning Journey

- **Enrollments**: Track user enrollment in courses
- **Lesson Progress**: Detailed tracking of user progress through lessons
- **Assessment Submissions**: User responses to quizzes and projects
- **User Notes**: Personal notes taken during learning

## Key Data Flows

### Course Generation Flow

1. User submits YouTube URL
2. System fetches video metadata and transcript
3. AI processes content to generate structured course
4. Course is saved to public catalog
5. User can enroll in the generated course

### Enrollment Flow

1. User discovers course in public catalog
2. User clicks "Enroll" button
3. System creates enrollment record
4. System increments course enrollment count
5. User is redirected to their courses page

### Learning Progress Flow

1. User accesses enrolled course
2. User completes lessons
3. System tracks progress in lesson_progress table
4. System updates enrollment progress percentage
5. When all lessons are completed, course is marked as completed

## Database Functions and Triggers

The following functions and triggers have been implemented to maintain data integrity:

- **Enrollment Management**:
  - `increment_course_enrollment_count`: Automatically increments the enrollment count when a user enrolls in a course
  - `decrement_course_enrollment_count`: Automatically decrements the enrollment count when a user unenrolls from a course
  - `manage_course_enrollment_count`: Trigger function that calls the appropriate function based on the operation (INSERT/DELETE)

- **User Stats Updates**:
  - `update_user_stats_on_enrollment_change`: Keeps user statistics current based on enrollment activity
  - Tracks courses in progress, completed courses, and total learning time

- **Course Structure Management**:
  - Normalized course structure with sections and lessons in separate tables
  - Maintains backward compatibility with the legacy JSONB structure

## Security Model

- **Row Level Security (RLS)**: Enforces access control at the database level
- **Public vs. Private Data**: Clear separation between public catalog and user-specific data
- **Service Role Access**: Administrative functions use the service role for necessary operations

## Performance Considerations

- **Normalized Structure**: Efficient querying and updating of specific components
- **Strategic Indexes**: Optimized for common query patterns
- **Denormalization Where Appropriate**: Some redundancy for read performance

This database structure supports all current Tenzzen features while enabling future expansion into advanced learning analytics, social learning features, and content marketplace capabilities.
