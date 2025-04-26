# Tenzzen Database Structure and User Flows

This document provides an overview of the Tenzzen learning platform's database structure, entity relationships, and key user flows.

## Database Schema Diagram

```mermaid
erDiagram
    USERS ||--o{ USER_PROFILES : has
    USERS ||--o{ USER_STATS : has
    USERS ||--o{ ENROLLMENTS : enrolls_in
    USERS ||--o{ NOTES : creates
    USERS ||--o{ RESOURCES : creates
    USERS ||--o{ RATINGS : submits
    USERS ||--o{ LEARNING_ACTIVITIES : generates
    USERS ||--o{ USER_INTERESTS : has
    USERS ||--o{ PROGRESS : tracks
    USERS ||--o{ ACHIEVEMENTS : earns
    USERS ||--o{ RECOMMENDATIONS : receives
    USERS ||--o{ PROJECT_SUBMISSIONS : submits

    COURSES ||--o{ ENROLLMENTS : has
    COURSES ||--o{ ASSESSMENTS : contains
    COURSES ||--o{ NOTES : referenced_in
    COURSES ||--o{ RESOURCES : referenced_in
    COURSES ||--o{ RATINGS : receives
    COURSES ||--o{ COURSE_TAGS : has
    COURSES ||--o{ COURSE_CATEGORIES : belongs_to
    COURSES ||--o{ COURSE_GROUP_MEMBERS : part_of

    CATEGORIES ||--o{ COURSE_CATEGORIES : in
    TAGS ||--o{ COURSE_TAGS : in

    ASSESSMENTS ||--o{ PROGRESS : for
    ASSESSMENTS ||--o{ PROJECT_SUBMISSIONS : receives

    VIDEOS }|--o{ PLAYLIST_VIDEOS : included_in
    PLAYLISTS ||--o{ PLAYLIST_VIDEOS : contains

    COURSE_GROUPS ||--o{ COURSE_GROUP_MEMBERS : has

    USERS {
        string clerkId
        string email
        string name
        string imageUrl
        string authProvider
        string role
        string status
        number createdAt
        number updatedAt
        object lastLogin
    }

    USER_PROFILES {
        string userId
        string bio
        string timezone
        string language
        object preferences
        object learningPreferences
        number updatedAt
    }

    USER_STATS {
        string userId
        number totalLearningHours
        number coursesCompleted
        number coursesInProgress
        number assessmentsCompleted
        number projectsSubmitted
        number lastActiveAt
        number streakDays
        number longestStreak
        number totalPoints
        array weeklyActivity
        array badges
        number level
        string learningStyle
        array topCategories
    }

    COURSES {
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
        number createdAt
        number updatedAt
        number estimatedHours
        array tags
        boolean featured
        number popularity
    }

    CATEGORIES {
        string name
        string description
        string icon
        string color
        string slug
        number courseCount
    }

    COURSE_CATEGORIES {
        id courseId
        id categoryId
    }

    TAGS {
        string name
        number useCount
    }

    COURSE_TAGS {
        id courseId
        id tagId
    }

    ENROLLMENTS {
        string userId
        id courseId
        number enrolledAt
        number lastAccessedAt
        string completionStatus
        number progress
        boolean isActive
        array completedLessons
        string lastLessonId
        number totalTimeSpent
        string notes
        boolean reminderEnabled
        string reminderFrequency
        object learningGoal
    }

    RATINGS {
        string userId
        id courseId
        number rating
        string review
        number createdAt
        number updatedAt
        number helpful
        boolean reported
        boolean verified
    }

    ASSESSMENTS {
        string title
        string description
        id courseId
        string type
        array questions
        string instructions
        array projectRequirements
        string submissionType
        array resources
        number deadline
        number createdAt
        string difficulty
        number estimatedTime
        number passingScore
        boolean allowRetries
        number maxRetries
    }

    PROGRESS {
        string userId
        id assessmentId
        string status
        number score
        any feedback
        any submission
        number startedAt
        number completedAt
        number attemptNumber
        number timeSpent
    }

    PROJECT_SUBMISSIONS {
        string userId
        id assessmentId
        string submissionUrl
        array fileIds
        string notes
        string status
        string feedback
        number grade
        number submittedAt
        number reviewedAt
        string reviewerNotes
        number revisionCount
    }

    NOTES {
        string userId
        string title
        string content
        id courseId
        string lessonId
        array tags
        number createdAt
        number updatedAt
        boolean isPublic
        string aiSummary
        array highlights
        boolean isFavorite
    }

    RESOURCES {
        string userId
        string title
        string type
        string url
        string content
        id courseId
        string lessonId
        string description
        array tags
        number createdAt
        number updatedAt
        boolean isPublic
        number views
        boolean isFavorite
        string sourceType
    }

    LEARNING_ACTIVITIES {
        string userId
        string type
        id courseId
        string lessonId
        id assessmentId
        number timestamp
        any metadata
        boolean visible
    }

    USER_INTERESTS {
        string userId
        id categoryId
        number interestLevel
        number createdAt
        number updatedAt
        string source
    }

    VIDEOS {
        string youtubeId
        object details
        array transcripts
        string cachedAt
    }

    PLAYLISTS {
        string youtubeId
        string title
        string description
        string thumbnail
        number itemCount
        string cachedAt
    }

    PLAYLIST_VIDEOS {
        id playlistId
        id videoId
        number position
    }

    RECOMMENDATIONS {
        string userId
        id courseId
        number score
        string reason
        number createdAt
        boolean viewed
        boolean dismissed
    }

    ACHIEVEMENTS {
        string userId
        string type
        string title
        string description
        number awardedAt
        number points
        string icon
        number level
        any metadata
    }

    COURSE_GROUPS {
        string title
        string description
        string thumbnail
        string creatorId
        boolean isPublic
        number createdAt
        number updatedAt
        number courseCount
        array tags
        string slug
    }

    COURSE_GROUP_MEMBERS {
        id groupId
        id courseId
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
- **Videos & Transcripts**: Videos store transcripts directly as an embedded array for content analysis and searchability.
- **Playlists & Videos**: Playlists organize videos in a sequence.
- **Course Groups & Courses**: Related courses can be organized into groups for learning paths.

### User Generated Content

- **Users & Notes**: Users create notes related to courses and lessons.
- **Users & Resources**: Users create or save resources for learning.
- **Users & Ratings**: Users rate and review courses.
- **Users & Projects**: Users submit projects for assessment.

### User Experience & Engagement

- **User Stats**: Aggregate metrics about a user's learning activity.
- **Achievements**: Gamification elements like badges and achievement records.
- **Recommendations**: Personalized course suggestions based on interests and history.
- **User Profiles**: Extended user information and preferences.

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
        API->>DB: Creates achievement record
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
        API->>DB: Fetches achievements
        API->>DB: Fetches recommendations
    end

    API->>UI: Returns dashboard data
    UI->>User: Displays learning metrics & activity
```

### Achievement & Gamification Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as Frontend UI
    participant API as Convex API
    participant DB as Database

    User->>UI: Completes learning activity
    UI->>API: Records activity completion
    API->>DB: Stores learning activity
    API->>DB: Checks achievement criteria

    alt Achievement Unlocked
        API->>DB: Creates achievement record
        API->>DB: Updates user stats & points
        API->>UI: Returns achievement notification
        UI->>User: Displays achievement animation
    end

    User->>UI: Views achievements page
    UI->>API: Requests user achievements
    API->>DB: Fetches achievements
    API->>UI: Returns formatted achievements
    UI->>User: Displays badges & achievements
```

## Database Indexing Strategy

The database schema includes strategic indexes to optimize common query patterns:

1. **User-Based Queries**

   - All tables with `userId` have indexes for quick retrieval of user-specific data
   - Compound indexes for user + entity combinations (e.g., user-course, user-assessment)

2. **Course Discovery**

   - Indexes on `isPublic` for exploring available courses
   - Compound indexes for filtering by category and tags
   - Full-text search indexes on course titles for enhanced search performance

3. **Content Relationships**

   - Indexes on all relationship tables (course_categories, course_tags)
   - Indexes on foreign keys for quick joins

4. **Time-Based Queries**
   - Indexes on timestamp fields for chronological sorting
   - Compound indexes for time-ranged user activities

## Data Flow Architecture

The Tenzzen platform follows a well-structured data flow pattern:

1. **Content Ingestion**

   - YouTube content is processed and stored in the videos table with embedded transcripts
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
   - Achievements and gamification elements enhance user engagement

## Type System

The database implements a strong type system for consistent data handling:

- **CourseStatus**: "draft" | "published" | "archived"
- **CompletionStatus**: "not_started" | "in_progress" | "completed"
- **AssessmentType**: "quiz" | "project" | "assignment"
- **SubmissionStatus**: "submitted" | "reviewed" | "revisions_requested" | "approved"
- **ActivityType**: Various activity types like "started_course", "completed_lesson", etc.
- **ResourceType**: "link", "document", "file", "video", "image", "code", "pdf"
- **DifficultyLevel**: "beginner", "intermediate", "advanced", "expert"

## Migration Notes

1. **Completed Migrations**:

   - ✅ Transcripts moved from standalone table to embedded array within videos table
   - ✅ Enhanced user system with separate user_profiles table
   - ✅ Added gamification through achievements table
   - ✅ Implemented recommendation system

2. **Future Enhancements**:
   - 🔄 Enhanced social learning features
   - 🔄 Learning path progression tracking
   - 🔄 Advanced analytics dashboards
