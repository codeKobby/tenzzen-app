# Tenzzen Database Structure and User Flows

This document provides an overview of the Tenzzen learning platform's database structure, entity relationships, and key user flows.

## Database Schema Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_STATS : has
    USERS ||--o{ ENROLLMENTS : enrolls_in
    USERS ||--o{ NOTES : creates
    USERS ||--o{ RESOURCES : creates
    USERS ||--o{ RATINGS : submits
    USERS ||--o{ LEARNING_ACTIVITIES : generates
    USERS ||--o{ USER_INTERESTS : has
    USERS ||--o{ PROGRESS : tracks

    COURSES ||--o{ ENROLLMENTS : has
    COURSES ||--o{ ASSESSMENTS : contains
    COURSES ||--o{ NOTES : referenced_in
    COURSES ||--o{ RESOURCES : referenced_in
    COURSES ||--o{ RATINGS : receives
    COURSES }o--o{ CATEGORIES : belongs_to
    COURSES }o--o{ TAGS : has

    CATEGORIES ||--o{ COURSE_CATEGORIES : in
    COURSE_CATEGORIES }o--|| COURSES : for

    TAGS ||--o{ COURSE_TAGS : in
    COURSE_TAGS }o--|| COURSES : for

    ASSESSMENTS ||--o{ PROGRESS : for
    ASSESSMENTS ||--o{ PROJECT_SUBMISSIONS : receives

    VIDEOS ||--o{ TRANSCRIPTS : has
    PLAYLISTS ||--o{ PLAYLIST_VIDEOS : contains
    PLAYLIST_VIDEOS }o--|| VIDEOS : links

    USERS {
        string id
        string email
        string name
        string imageUrl
        timestamp createdAt
    }

    USER_STATS {
        id _id
        string userId
        number totalLearningHours
        number coursesCompleted
        number coursesInProgress
        number assessmentsCompleted
        number projectsSubmitted
        timestamp lastActiveAt
        number streakDays
        number longestStreak
        number totalPoints
        array weeklyActivity
    }

    COURSES {
        id _id
        string title
        string subtitle
        string description
        string videoId
        string thumbnail
        boolean isPublic
        string creatorId
        number avgRating
        number enrollmentCount
        object overview
        array sections
        object metadata
        string status
        timestamp createdAt
        timestamp updatedAt
        number estimatedHours
        array tags
    }

    CATEGORIES {
        id _id
        string name
        string description
        string icon
        string color
        string slug
        number courseCount
    }

    COURSE_CATEGORIES {
        id _id
        id courseId
        id categoryId
    }

    TAGS {
        id _id
        string name
        number useCount
    }

    COURSE_TAGS {
        id _id
        id courseId
        id tagId
    }

    ENROLLMENTS {
        id _id
        string userId
        id courseId
        timestamp enrolledAt
        timestamp lastAccessedAt
        string completionStatus
        number progress
        boolean isActive
        array completedLessons
        string lastLessonId
        number totalTimeSpent
        string notes
    }

    RATINGS {
        id _id
        string userId
        id courseId
        number rating
        string review
        timestamp createdAt
        timestamp updatedAt
        number helpful
    }

    ASSESSMENTS {
        id _id
        string title
        string description
        id courseId
        string type
        array questions
        string instructions
        array projectRequirements
        string submissionType
        array resources
        timestamp deadline
        timestamp createdAt
    }

    PROGRESS {
        id _id
        string userId
        id assessmentId
        string status
        number score
        string feedback
        any submission
        timestamp startedAt
        timestamp completedAt
    }

    PROJECT_SUBMISSIONS {
        id _id
        string userId
        id assessmentId
        string submissionUrl
        array fileIds
        string notes
        string status
        string feedback
        number grade
        timestamp submittedAt
        timestamp reviewedAt
    }

    NOTES {
        id _id
        string userId
        string title
        string content
        id courseId
        string lessonId
        array tags
        timestamp createdAt
        timestamp updatedAt
        boolean isPublic
    }

    RESOURCES {
        id _id
        string userId
        string title
        string type
        string url
        string content
        id courseId
        string lessonId
        string description
        array tags
        timestamp createdAt
        timestamp updatedAt
        boolean isPublic
    }

    LEARNING_ACTIVITIES {
        id _id
        string userId
        string type
        id courseId
        string lessonId
        id assessmentId
        timestamp timestamp
        object metadata
    }

    USER_INTERESTS {
        id _id
        string userId
        id categoryId
        number interestLevel
        timestamp createdAt
        timestamp updatedAt
    }

    VIDEOS {
        id _id
        string youtubeId
        object details
        array transcripts
        timestamp cachedAt
    }

    TRANSCRIPTS {
        id _id
        string youtubeId
        string language
        array segments
        timestamp cachedAt
    }

    PLAYLISTS {
        id _id
        string youtubeId
        string title
        string description
        string thumbnail
        number itemCount
        timestamp cachedAt
    }

    PLAYLIST_VIDEOS {
        id _id
        id playlistId
        id videoId
        number position
    }
```

## Key Data Relationships

### Core Learning Experience

- **Users & Courses**: Users enroll in courses, which creates an enrollment record to track progress and completion status.
- **Courses & Assessments**: Courses contain assessments (quizzes and projects) to evaluate learning progress.
- **Assessments & Progress**: User progress is tracked for each assessment, recording scores and submission data.
- **Learning Activities**: All user actions generate learning activities, which are used for analytics and personalization.

### Content Organization

- **Courses & Categories**: Courses belong to multiple categories for organization and discovery.
- **Courses & Tags**: Courses have multiple tags for enhanced searchability.
- **Videos & Transcripts**: Videos store transcripts for content analysis and searchability.
- **Playlists & Videos**: Playlists organize videos in a sequence.

### User Generated Content

- **Users & Notes**: Users create notes related to courses and lessons.
- **Users & Resources**: Users create or save resources for learning.
- **Users & Ratings**: Users rate and review courses.

### Learning Metrics

- **User Stats**: Aggregate metrics about a user's learning activity.
- **Enrollments**: Track course progress and completion data.
- **Progress**: Track assessment completion and scores.

## Key User Flows

### Course Generation Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Convex API
    participant AI as AI Processing
    participant DB as Database

    User->>UI: Enters YouTube URL or topic
    UI->>API: Sends content for analysis
    API->>AI: Requests content processing
    AI->>AI: Analyzes content and structure
    AI->>API: Returns course structure
    API->>DB: Stores course data
    API->>UI: Returns course details
    UI->>User: Displays generated course
```

### Course Enrollment Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Convex API
    participant DB as Database

    User->>UI: Clicks "Enroll" on course
    UI->>API: Calls enrollInCourse() mutation
    API->>DB: Checks for existing enrollment
    alt New Enrollment
        API->>DB: Creates new enrollment record
        API->>DB: Increments course enrollment count
        API->>DB: Creates learning activity
        API->>DB: Updates user stats
    else Already Enrolled
        API->>DB: Updates last accessed timestamp
    end
    API->>UI: Returns enrollment status
    UI->>User: Shows course content
```

### Learning Progress Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Convex API
    participant DB as Database

    User->>UI: Completes lesson or assessment
    UI->>API: Calls updateCourseProgress()
    API->>DB: Updates enrollment progress
    API->>DB: Adds completed lesson to list
    API->>DB: Records learning activity
    API->>DB: Updates user statistics

    alt Course Completed
        API->>DB: Marks course as completed
        API->>DB: Updates completion metrics
        API->>UI: Prompts for course rating
    end

    API->>UI: Returns updated progress
    UI->>User: Shows progress indicators
```

### Project Submission Flow

```mermaid
sequenceDiagram
    actor Student
    actor Instructor
    participant UI as Frontend UI
    participant API as Convex API
    participant DB as Database

    Student->>UI: Submits project work
    UI->>API: Calls submitProject()
    API->>DB: Creates project submission
    API->>DB: Updates progress record
    API->>DB: Records learning activity
    API->>UI: Returns submission confirmation
    UI->>Student: Shows submission status

    Instructor->>UI: Reviews submission
    UI->>API: Calls reviewProjectSubmission()
    API->>DB: Updates submission status
    API->>DB: Adds feedback and grade
    API->>DB: Creates feedback activity
    API->>UI: Returns review confirmation
    UI->>Student: Notifies of feedback
```

### Notes & Resources Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Convex API
    participant DB as Database

    User->>UI: Creates note/resource
    UI->>API: Calls createOrUpdateNote() or createOrUpdateResource()
    API->>DB: Stores note/resource data
    API->>DB: Updates associated tags
    API->>UI: Returns confirmation
    UI->>User: Updates library view

    User->>UI: Searches library content
    UI->>API: Calls getUserNotes() or getUserResources() with filters
    API->>DB: Performs filtered query
    API->>UI: Returns matching items
    UI->>User: Displays filtered results
```

### Dashboard Analytics Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Convex API
    participant DB as Database

    User->>UI: Opens dashboard
    UI->>API: Calls getUserDashboardStats()

    par Parallel Requests
        API->>DB: Fetches user stats
        API->>DB: Fetches recent activities
        API->>DB: Fetches in-progress courses
    end

    API->>UI: Returns dashboard data
    UI->>User: Displays learning metrics & activity
```

## Database Indexing Strategy

The database schema includes strategic indexes to optimize common query patterns:

1. **User-Based Queries**

   - All tables with `userId` have indexes for quick retrieval of user-specific data
   - Compound indexes for user + entity combinations (e.g., user-course, user-assessment)

2. **Course Discovery**

   - Indexes on `isPublic` for exploring available courses
   - Compound indexes for filtering by category and tags
   - Full-text search indexes on course titles and descriptions

3. **Content Relationships**

   - Indexes on all relationship tables (course_categories, course_tags)
   - Indexes on foreign keys for quick joins

4. **Time-Based Queries**
   - Indexes on timestamp fields for chronological sorting
   - Compound indexes for time-ranged user activities

## Data Flow Architecture

The Tenzzen platform follows a well-structured data flow pattern:

1. **Content Ingestion**

   - YouTube content is processed and stored in the videos and transcripts tables
   - AI analysis transforms raw content into structured course data

2. **User Engagement**

   - User interactions are captured as enrollments and learning activities
   - Progress is tracked at multiple levels (course, lesson, assessment)

3. **Content Generation**

   - Users create notes and resources linked to courses and lessons
   - User feedback generates ratings and reviews

4. **Analytics & Personalization**
   - User actions aggregate into statistics and trends
   - Personalized recommendations are generated based on interests and history

This architecture ensures efficient data storage, retrieval, and analysis while supporting the platform's core learning features and personalization capabilities.
