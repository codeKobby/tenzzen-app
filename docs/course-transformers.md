# Course Data Transformers Documentation

This document explains the course data transformation functions used in the Tenzzen platform.

## Overview

The Tenzzen platform uses a set of transformation functions to ensure consistent data structure throughout the application. These transformers standardize course data as it flows between different parts of the system:

1. **ADK Service → Database**: Standardizing course data from the ADK service before storing in the database
2. **Database → Frontend**: Preparing database records for frontend display

## Transformation Functions

### `transformADKCourseToDatabase`

Transforms course data from the ADK service format to the database format.

**Location**: `lib/transformers/course.ts`

**Purpose**:
- Standardize course data structure
- Calculate and populate duration fields
- Calculate and populate lesson count fields
- Ensure all required fields are present

**Input**: ADK course data object
**Output**: Database-ready course object

**Key Transformations**:
- Calculates `duration_seconds` from course sections and lessons
- Calculates `total_lessons` from course sections
- Maintains backward compatibility with legacy fields
- Normalizes metadata structure

**Example Usage**:
```typescript
import { transformADKCourseToDatabase } from "@/lib/transformers/course";

// In API endpoint
const courseRecord = transformADKCourseToDatabase(courseData);
await supabase.from('courses').insert(courseRecord);
```

### `transformDatabaseCourseToFrontend`

Transforms course data from the database format to the frontend format.

**Location**: `lib/transformers/course.ts`

**Purpose**:
- Prepare database records for UI components
- Normalize section and lesson structure
- Add UI-specific fields
- Ensure consistent data access patterns

**Input**: Database course record
**Output**: Frontend-ready course object

**Key Transformations**:
- Normalizes sections and lessons from `course_items`
- Adds UI-specific fields like `progress`
- Ensures consistent field naming
- Provides defaults for missing values

**Example Usage**:
```typescript
import { transformDatabaseCourseToFrontend } from "@/lib/transformers/course";

// In data fetching function
const { data } = await supabase.from('courses').select().eq('id', courseId).single();
const course = transformDatabaseCourseToFrontend(data);
```

## Duration Utility Functions

The transformers use utility functions from `lib/utils/duration.ts` to handle duration calculations and formatting:

### `parseDurationToSeconds`

Parses various duration formats into seconds.

**Input**: Duration string or number
**Output**: Total seconds (number)

**Supported Formats**:
- Numbers (assumed to be seconds)
- Time strings with colons (HH:MM:SS or MM:SS)
- Duration strings with 'h' and 'm' (e.g., "1h 30m")

### `calculateTotalDurationFromSections`

Calculates the total duration from course sections and lessons.

**Input**: Array of course sections
**Output**: Total duration in seconds

## Implementation Guidelines

When implementing new features that work with course data:

1. **Always use transformers** for data conversion between system layers
2. **Don't manipulate raw data** directly; use the transformation functions
3. **Add new fields** to both transformers when extending the data model
4. **Maintain backward compatibility** by handling legacy data formats

## Error Handling

The transformers include error handling to ensure robust operation:

- Validation of input data
- Default values for missing fields
- Type checking and conversion
- Graceful handling of malformed data

## Future Improvements

Planned improvements to the transformation system:

1. Add TypeScript interfaces for all data structures
2. Implement validation using Zod or similar
3. Add unit tests for all transformation functions
4. Create specialized transformers for different use cases
