# Assessment System Documentation

## Overview

The assessment system provides a comprehensive solution for handling course assessments, including tests, assignments, and projects. It implements lazy loading of assessment content and progress tracking.

## Core Components

### Backend (Convex)

1. **Schema (`convex/schema.ts`)**
   - Defines data structure for courses, assessments, and progress
   - Handles relationships between entities
   - Sets up necessary indexes

2. **Assessment Management (`convex/assessments.ts`)**
   - Manages assessment lifecycle
   - Handles content generation and storage
   - Controls assessment locking/unlocking

3. **Progress Tracking (`convex/progress.ts`)**
   - Tracks student progress
   - Handles submissions and grading
   - Stores completion status

4. **AI Integration (`convex/ai.ts`)**
   - Handles assessment content generation
   - Provides development mode mocks
   - Isolates AI functionality

### Frontend Components

1. **Assessment Card (`components/assessment/assessment-card.tsx`)**
   - Displays assessment information
   - Handles unlock/start interactions
   - Shows progress and status

2. **Section Assessments (`components/assessment/section-assessments.tsx`)**
   - Lists assessments for a course section
   - Manages assessment organization
   - Shows section progress

3. **Progress Display (`app/courses/[courseId]/progress/page.tsx`)**
   - Shows overall course progress
   - Displays section-by-section progress
   - Lists all assessments with status

### Custom Hooks

1. **`useAssessment` (`hooks/use-assessment.ts`)**
   - Manages assessment state
   - Handles content generation
   - Tracks progress and submissions

## Workflow

1. **Initial Course Load**
   - Course structure loaded with assessment placeholders
   - Assessment content not generated initially
   - Progress data fetched if available

2. **Assessment Access**
   - Student navigates to an assessment
   - System checks prerequisites
   - Content generated if not already available
   - Assessment unlocked if prerequisites met

3. **Taking Assessments**
   - Student starts assessment
   - Progress tracked in real-time
   - Submissions saved and processed
   - Results calculated and stored

4. **Progress Tracking**
   - Overall progress calculated
   - Section completion tracked
   - Individual assessment status maintained

## Assessment Types

1. **Tests**
   - Multiple choice or written questions
   - Automatic grading for multiple choice
   - Instructor review for written answers

2. **Assignments**
   - Practical hands-on tasks
   - Clear acceptance criteria
   - Optional hints available

3. **Projects**
   - Comprehensive course-end assessments
   - Multiple submission formats
   - Detailed guidelines and requirements

## Implementation Details

### Data Flow
```
User Action -> Hook -> Convex Mutation -> Database -> UI Update
```

### Content Generation
```
Assessment Request -> Check Cache -> Generate if Needed -> Store -> Serve
```

### Progress Tracking
```
Submit -> Validate -> Grade -> Update Progress -> Show Results
```

## Technical Dependencies

- Convex for backend
- Next.js for frontend
- Radix UI for components
- OpenAI for content generation
- TailwindCSS for styling

## Best Practices

1. **Performance**
   - Lazy load assessment content
   - Cache generated content
   - Optimize progress calculations

2. **Security**
   - Validate prerequisites
   - Secure content generation
   - Protect submission data

3. **User Experience**
   - Clear progress indicators
   - Immediate feedback
   - Graceful error handling

## Future Improvements

1. **Features**
   - Peer review system
   - More question types
   - Interactive assignments

2. **Technical**
   - Offline support
   - Better caching
   - Performance optimizations

3. **Analytics**
   - Learning patterns
   - Success metrics
   - Difficulty analysis