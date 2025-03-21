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

## Usage Pattern

The typical flow works like this:
1. Course structure is created with assessment placeholders
2. Content is generated only when a student reaches an assessment
3. Progress is tracked as students complete assessments
4. Generated content is stored for reuse

This architecture supports both real-time learning experiences and efficient resource usage.