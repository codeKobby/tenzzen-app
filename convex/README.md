# Convex Backend Structure

This directory contains the backend functionality implemented using Convex. Here's an overview of each file's purpose and responsibility:

## File Structure

### `schema.ts`

- Defines database schema and table structures
- Sets up relationships between entities:
  - Courses
  - Assessments
  - User Progress
- Configures indexes for efficient querying
- Imports and uses validators from validation.ts

### `validation.ts`

- Defines all data validation rules using Convex validators
- Organizes validators by domain (user, course, assessment, etc.)
- Exports TypeScript types for use throughout the application
- Ensures data consistency and type safety

### `assessments.ts`

- Handles assessment lifecycle management
- Endpoints:
  - Get assessment content
  - Generate new assessments
  - Update assessment states (locked/unlocked)
- Acts as intermediary between frontend and database
- Integrates with AI generation when needed

### `progress.ts`

- Manages user progression through courses
- Features:
  - Track assessment attempts
  - Store submissions
  - Handle grading
  - Record completion status
- Enforces assessment prerequisites

### `ai.ts`

- Isolates AI-related functionality
- Handles:
  - Assessment content generation
  - Test questions
  - Assignment tasks
  - Project requirements
- Development mode mocks
- Production AI integration

## Database Validation

Our database schema uses a robust validation approach:

1. **Centralized Validators**

   - All validation rules are defined in `validation.ts`
   - Validators are exported and reused across the schema
   - TypeScript types are generated from the same source

2. **Enum-like Validation**

   - String fields with specific allowed values use `v.union()` with `v.literal()`
   - Examples: user roles, course status, difficulty levels

3. **Type Safety**

   - Runtime validation via Convex schema
   - TypeScript type checking at development time
   - Consistent types between frontend and backend

4. **Validator Categories**

   - User related (roles, status, auth providers)
   - Course related (status, difficulty, completion)
   - Assessment related (types, submission, progress)
   - Resource related (types, sources)
   - Activity related (types, learning styles)

5. **Implementation Example**

   ```typescript
   // In validation.ts
   export const userRoleValidator = v.union(
     v.literal("user"),
     v.literal("admin"),
     v.literal("moderator"),
     v.literal("instructor")
   );

   // In schema.ts
   users: defineTable({
     // ...other fields
     role: userRoleValidator,
     // ...other fields
   });
   ```

## Architecture Benefits

1. **Separation of Concerns**

   - Each file has a single responsibility
   - Clear boundaries between features
   - Easier maintenance and testing

2. **Cost Optimization**

   - AI generation only when needed
   - Caching of generated content
   - Development mode mocks

3. **Security**

   - Controlled access to AI features
   - User authentication
   - Data validation

4. **Performance**

   - Efficient database queries
   - Optimized indexes
   - Lazy loading of content

5. **Data Integrity**
   - Strict validation rules enforce data quality
   - Prevents invalid data from entering the database
   - Consistent data types across the application

## Usage Pattern

The typical flow works like this:

1. Course structure is created with assessment placeholders
2. Content is generated only when a student reaches an assessment
3. Progress is tracked as students complete assessments
4. Generated content is stored for reuse

This architecture supports both real-time learning experiences and efficient resource usage.
