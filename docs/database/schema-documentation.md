# Tenzzen Database Schema Documentation

This document provides a comprehensive overview of the Tenzzen application's database schema, including tables, relationships, and validation rules. The database is implemented using [Convex](https://www.convex.dev/), a backend platform that provides a real-time database with built-in functions.

## Table of Contents

1. [Overview](#overview)
2. [Core Tables](#core-tables)
3. [Relationships](#relationships)
4. [Validation](#validation)
5. [Indexes](#indexes)
6. [Data Flow](#data-flow)
7. [Common Queries](#common-queries)

## Overview

The Tenzzen database schema is designed around a learning platform that allows users to:

- Create and manage courses
- Track learning progress
- Complete assessments
- Interact with YouTube content
- Create notes and resources
- Track achievements and statistics

The schema follows a normalized design with proper relationships between entities and uses Convex's validation system to ensure data integrity.

## Core Tables

### User Management

#### `users`

- Core user information linked with Clerk authentication
- Stores basic identity, role, and status
- Key fields:
  - `clerkId`: External ID from Clerk authentication
  - `email`: User's email address
  - `role`: Role-based access control (user, admin, moderator, instructor)
  - `status`: Account status (active, suspended, deleted, pending)

#### `user_profiles`

- Extended user information and preferences
- Stores profile data, preferences, and learning preferences
- Linked to users table via `userId`

#### `user_stats`

- Aggregated statistics about user activity
- Tracks learning hours, completed courses, streak days, etc.
- Used for gamification and user dashboard metrics

### Content Management

#### `videos`

- YouTube video metadata and transcripts
- Stores video details, cached transcripts, and generated course data
- Identified by `youtubeId`

#### `playlists`

- YouTube playlist information
- Stores playlist metadata
- Related to videos through the `playlist_videos` join table

#### `courses`

- Contains course information and structure
- Stores title, description, sections, and metadata
- Can be system-generated from YouTube content or manually created
- Has attributes for public/private status and enrollment tracking

#### `categories` and `tags`

- Taxonomies for organizing and discovering courses
- Related to courses through join tables (`course_categories` and `course_tags`)

### Learning Experience

#### `enrollments`

- Tracks user enrollment in courses
- Stores progress, completion status, and learning goals
- Key relationship between users and courses

#### `assessments`

- Defines tests, assignments, and projects within courses
- Stores questions, requirements, and submission options
- Linked to courses

#### `progress`

- Tracks user progress on assessments
- Stores submission data, scores, and feedback
- Links users to assessments

#### `learning_activities`

- Detailed tracking of user actions within the platform
- Used for activity feeds and detailed progress tracking

#### `notes` and `resources`

- User-created content for personal learning
- Can be linked to courses and lessons
- Supports organization with tags

### Achievement and Recommendations

#### `achievements`

- Tracks user accomplishments and rewards
- Used for gamification features
- Various types including streaks, course completions, etc.

#### `recommendations`

- Personalized course recommendations for users
- Generated based on interests, history, and similar users
- Stores recommendation strength and reason

## Relationships

The database schema defines several key relationships:

### One-to-One Relationships

- `users` ↔ `user_profiles`: Each user has one profile
- `users` ↔ `user_stats`: Each user has one stats record

### One-to-Many Relationships

- `users` → `enrollments`: One user can enroll in many courses
- `courses` → `assessments`: One course can have many assessments
- `courses` → `enrollments`: One course can have many enrolled users
- `users` → `notes`: One user can create many notes
- `users` → `resources`: One user can create many resources
- `users` → `achievements`: One user can earn many achievements

### Many-to-Many Relationships

- `courses` ↔ `categories`: Through `course_categories` join table
- `courses` ↔ `tags`: Through `course_tags` join table
- `playlists` ↔ `videos`: Through `playlist_videos` join table
- `users` ↔ `categories` (interests): Through `user_interests` join table

### Relationship Diagram (Simplified)

```
users
 ├── user_profiles
 ├── user_stats
 ├── enrollments ────┐
 │    └── courses ◄──┘
 │         ├── assessments ───┐
 │         ├── categories     │
 │         └── tags           │
 ├── progress ◄───────────────┘
 ├── notes
 ├── resources
 ├── achievements
 ├── learning_activities
 └── recommendations
      └── courses

videos
 └── playlists (via playlist_videos)
```

## Validation

The database implements comprehensive validation rules to ensure data integrity.

### Validation Approach

1. **Centralized Validators**

   - All validation rules are defined in `validation.ts`
   - Validators are exported and reused across the schema
   - TypeScript types are generated from the same source

2. **Enum-like Validation**
   Specific string fields use `v.union()` with `v.literal()` to create enum-like validations:

   ```typescript
   // User role validation example
   export const userRoleValidator = v.union(
     v.literal("user"),
     v.literal("admin"),
     v.literal("moderator"),
     v.literal("instructor")
   );
   ```

3. **Field Types and Constraints**
   - String fields: Used for text data with optional constraints
   - Number fields: Used for numeric data
   - Boolean fields: Used for true/false flags
   - Object fields: Used for structured nested data
   - Array fields: Used for lists
   - ID references: Used for relationships between tables

### Key Validated Fields

- `users.role`: Restricted to predefined roles
- `users.status`: Restricted to predefined status values
- `users.authProvider`: Restricted to supported authentication providers
- `assessments.type`: Restricted to supported assessment types
- `courses.status`: Restricted to predefined status values
- `progress.status`: Restricted to valid progress states
- `resources.type`: Restricted to supported resource types

## Indexes

The schema defines strategic indexes to optimize common query patterns:

### User-Related Indexes

- `users.by_clerk_id`: Fast lookup of users by Clerk ID
- `users.by_email`: Email-based user lookup
- `users.by_role`: Filter users by role

### Content-Related Indexes

- `courses.by_public`: Filter for public courses
- `courses.by_creator`: Filter courses by creator
- `courses.by_featured`: Quick access to featured courses
- `courses.by_popularity`: Sort courses by popularity
- `courses.search_courses`: Full-text search on course titles

### Learning-Related Indexes

- `enrollments.by_user`: Find all enrollments for a user
- `enrollments.by_course`: Find all enrollments for a course
- `enrollments.by_user_course`: Check if a user is enrolled in a specific course
- `enrollments.by_completion`: Filter by completion status
- `assessments.by_course`: Find all assessments for a course
- `assessments.by_type`: Filter assessments by type
- `progress.by_user_assessment`: Find a user's progress on a specific assessment

## Data Flow

The typical data flow in the Tenzzen application follows these patterns:

### Course Creation Flow

1. YouTube video or playlist is processed via YouTube API
2. Video metadata and transcripts are stored in `videos` table
3. AI processing generates course structure
4. Generated course is stored in `courses` table with sections
5. Course is categorized and tagged
6. Assessments are generated and stored in `assessments` table

### User Learning Flow

1. User enrolls in a course (creates record in `enrollments`)
2. User progresses through course content
3. Learning activities are tracked in `learning_activities`
4. User completes assessments (tracked in `progress`)
5. Course completion status is updated in `enrollments`
6. User statistics are updated in `user_stats`
7. Achievements are awarded in `achievements`

### Recommendation Flow

1. User interests are tracked in `user_interests`
2. Learning history is analyzed from `enrollments` and `learning_activities`
3. Recommendations are generated and stored in `recommendations`
4. User is shown personalized recommendations

## Common Queries

The schema is optimized for these common query patterns:

### User Dashboard

```typescript
// Get user's active enrollments
db.query("enrollments")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .filter((q) => q.eq(q.field("isActive"), true))
  .collect();

// Get user's recent learning activities
db.query("learning_activities")
  .withIndex("by_user_time", (q) => q.eq("userId", userId))
  .order("desc")
  .take(10);

// Get user's achievements
db.query("achievements")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();
```

### Course Discovery

```typescript
// Get featured courses
db.query("courses")
  .withIndex("by_featured", (q) => q.eq("featured", true))
  .collect();

// Get popular courses
db.query("courses").withIndex("by_popularity").order("desc").take(10);

// Search courses by query
db.query("courses")
  .withSearchIndex("search_courses", (q) => q.search("title", searchQuery))
  .filter((q) => q.eq(q.field("isPublic"), true))
  .collect();
```

### Learning Progress

```typescript
// Get user's progress in a course
db.query("enrollments")
  .withIndex("by_user_course", (q) =>
    q.eq("userId", userId).eq("courseId", courseId)
  )
  .unique();

// Get user's assessment progress
db.query("progress")
  .withIndex("by_user", (q) => q.eq("userId", userId))
  .collect();
```

---

This documentation provides a high-level overview of the Tenzzen database schema. For detailed field definitions, refer to the `schema.ts` file in the Convex directory. For validation rules, see the `validation.ts` file.

For any changes to the schema, ensure proper migration strategies are employed to preserve data integrity.
