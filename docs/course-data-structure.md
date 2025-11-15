# Course Data Structure Documentation

This document outlines the standardized data structure for courses in the Tenzzen platform.

## Database Schema

### Courses Table

The `courses` table in Supabase contains the following key fields:

| Field Name | Type | Description |
|------------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Course title |
| description | TEXT | Course description |
| video_id | TEXT | YouTube video ID |
| video_reference | TEXT | Normalized YouTube video reference |
| youtube_url | TEXT | Full YouTube URL |
| thumbnail | TEXT | Course thumbnail URL |
| is_public | BOOLEAN | Whether the course is public |
| status | TEXT | Course status (published, draft, etc.) |
| difficulty_level | TEXT | Course difficulty level |
| duration_seconds | INTEGER | **Standardized** total duration in seconds |
| total_lessons | INTEGER | **Standardized** total number of lessons |
| estimated_duration | TEXT | Legacy duration field (formatted string) |
| estimated_hours | FLOAT | Legacy duration field (in hours) |
| tags | JSONB | Array of course tags |
| category | TEXT | Course category |
| metadata | JSONB | Additional course metadata |
| course_items | JSONB | Course sections and lessons |
| transcript | TEXT | Course transcript |
| created_by | UUID | User ID who created the course |
| creator_id | TEXT | Clerk ID of the creator |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## Standardized Fields

### Duration Fields

The platform now uses standardized duration fields to ensure consistent handling of course durations:

- **duration_seconds**: Integer value representing the total course duration in seconds
  - This is the primary field for duration calculations
  - Used for sorting, filtering, and display purposes
  - Calculated from course sections and lessons when available

### Lesson Count Fields

The platform now uses standardized lesson count fields:

- **total_lessons**: Integer value representing the total number of lessons in the course
  - This is the primary field for lesson count calculations
  - Used for progress tracking and display purposes
  - Calculated from course sections when available

## Data Transformation

### Course Data Flow

1. **ADK Service → Database**:
   - The ADK service generates course data
   - The `transformADKCourseToDatabase` function standardizes the data
   - Standardized data is stored in the database

2. **Database → Frontend**:
   - Database records are retrieved
   - The `transformDatabaseCourseToFrontend` function prepares data for UI
   - Frontend components use standardized fields with fallbacks

## Utility Functions

### Duration Formatting

The platform includes utility functions for consistent duration formatting:

- **formatDurationFromSeconds(seconds)**: Formats seconds into YouTube-style duration (MM:SS or HH:MM:SS)
- **formatDurationHumanReadable(seconds)**: Formats seconds into human-readable format (e.g., "1h 30m")
- **parseDurationToSeconds(duration)**: Parses various duration formats into seconds
- **calculateTotalDurationFromSections(sections)**: Calculates total duration from course sections

## Implementation Guidelines

### Using Standardized Fields

When working with course data:

1. Always use `duration_seconds` for duration calculations and sorting
2. Always use `total_lessons` for lesson count and progress calculations
3. Include fallbacks for backward compatibility with older course records
4. Use the appropriate formatting function for displaying durations

### Adding New Courses

When adding new courses:

1. Calculate and store `duration_seconds` and `total_lessons`
2. Use the transformation functions to ensure consistent data structure
3. Maintain backward compatibility by populating legacy fields

## Example Usage

```typescript
// Formatting duration for display
const displayDuration = formatDurationFromSeconds(course.duration_seconds);

// Calculating progress
const progress = course.total_lessons > 0 
  ? Math.floor((completedLessons.length / course.total_lessons) * 100) 
  : 0;

// Transforming course data
const dbCourse = transformADKCourseToDatabase(adkCourse);
const frontendCourse = transformDatabaseCourseToFrontend(dbCourse);
```
