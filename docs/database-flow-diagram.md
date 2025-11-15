# Tenzzen Database Flow Diagram

This document provides visual representations of the key data flows in the Tenzzen learning platform. These flows have been fully implemented and are currently active in the application.

## Course Generation Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant ADK
    participant API
    participant Videos
    participant Courses
    participant Sections
    participant Lessons
    participant Categories
    participant Tags

    User->>Frontend: Submit YouTube URL
    Frontend->>API: Fetch video data
    API->>Videos: Check if video exists

    alt Video exists
        Videos-->>API: Return existing video
    else Video doesn't exist
        API->>Videos: Save video metadata
        Videos-->>API: Return new video ID
    end

    API->>ADK: Send video transcript
    ADK->>API: Return structured course

    API->>Courses: Check if course exists

    alt Course exists
        Courses-->>API: Return existing course
        API->>Sections: Update sections
        API->>Lessons: Update lessons
    else Course doesn't exist
        API->>Courses: Create new course
        Courses-->>API: Return new course ID

        loop For each section
            API->>Sections: Create section
            Sections-->>API: Return section ID

            loop For each lesson
                API->>Lessons: Create lesson
            end
        end

        alt Has category
            API->>Categories: Get or create category
            API->>Courses: Link course to category
        end

        loop For each tag
            API->>Tags: Get or create tag
            API->>Courses: Link course to tag
        end
    end

    API-->>Frontend: Return course data
    Frontend-->>User: Display course
```

## Enrollment Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Courses
    participant Enrollments
    participant LessonProgress
    participant UserStats

    User->>Frontend: Click "Enroll" button
    Frontend->>API: Send enrollment request

    API->>Enrollments: Check if already enrolled

    alt Already enrolled
        Enrollments-->>API: Return existing enrollment
    else Not enrolled
        API->>Enrollments: Create enrollment record
        Enrollments-->>API: Return new enrollment ID

        API->>Courses: Increment enrollment count

        API->>LessonProgress: Create initial progress records

        API->>UserStats: Update courses_in_progress
    end

    API-->>Frontend: Return enrollment status
    Frontend->>Frontend: Navigate to courses page
    Frontend-->>User: Show success message
```

## Learning Progress Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Enrollments
    participant LessonProgress
    participant UserStats

    User->>Frontend: Access enrolled course
    Frontend->>API: Fetch course with progress

    API->>Enrollments: Get enrollment data
    Enrollments-->>API: Return enrollment

    API->>LessonProgress: Get lesson progress
    LessonProgress-->>API: Return progress data

    API-->>Frontend: Return course with progress
    Frontend-->>User: Display course with progress

    User->>Frontend: Complete lesson
    Frontend->>API: Update lesson progress

    API->>LessonProgress: Mark lesson as completed
    API->>Enrollments: Update overall progress

    alt All lessons completed
        API->>Enrollments: Mark course as completed
        API->>UserStats: Update completion stats
    end

    API-->>Frontend: Return updated progress
    Frontend-->>User: Show updated progress
```

## Course Discovery Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Courses
    participant Categories
    participant Tags

    User->>Frontend: Visit explore page
    Frontend->>API: Fetch courses

    API->>Categories: Fetch categories
    Categories-->>API: Return categories

    API->>Courses: Fetch public courses
    Courses-->>API: Return courses

    API-->>Frontend: Return courses and categories
    Frontend-->>User: Display course catalog

    User->>Frontend: Select category
    Frontend->>API: Fetch courses by category

    API->>Courses: Filter by category
    Courses-->>API: Return filtered courses

    API-->>Frontend: Return filtered courses
    Frontend-->>User: Display filtered courses
```

## User Notes Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant UserNotes

    User->>Frontend: Create note during lesson
    Frontend->>API: Save note

    API->>UserNotes: Store note
    UserNotes-->>API: Confirm save

    API-->>Frontend: Return success
    Frontend-->>User: Show save confirmation

    User->>Frontend: View notes
    Frontend->>API: Fetch notes

    API->>UserNotes: Get user's notes
    UserNotes-->>API: Return notes

    API-->>Frontend: Return notes data
    Frontend-->>User: Display notes
```

## Database Entity Relationships

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
```
