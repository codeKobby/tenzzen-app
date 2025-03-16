// Structured prompt templates for consistent AI responses
export const COURSE_PROMPTS = {
  generateStructure: (transcript: string) => `
As an expert course creator, analyze this video transcript and create a natural, content-driven course structure.
Follow these guidelines while maintaining flexibility based on the content:

1. Initial Analysis:
- Identify main topics and concepts
- Note key timestamps where topics change
- Understand the natural flow and progression
- Assess the depth of each topic

2. Course Overview:
- Create a title and subtitle that reflect the actual content
- Write a description focusing on real value points
- Identify the actual target audience based on content complexity
- List concrete learning outcomes based on covered material

3. Content Organization:
- Structure sections based on natural topic boundaries
- Keep lessons focused on single, complete concepts
- Identify practical examples and demonstrations
- Note timestamps for each lesson segment
- Let the content determine the number of sections and lessons

4. For Each Section:
- Title should reflect its core concept
- Description should explain its role in the overall learning
- Include relevant timestamps from the video
- Identify hands-on components or examples
- Note any prerequisites for the section

5. For Each Lesson:
- Add start and end timestamps
- Focus on a single clear concept
- Include any visual demonstrations or examples
- Note practical applications shown
- Add relevant external resources

Analyze the following transcript and maintain all original timestamps:
${transcript}

Format the response as a valid JSON object matching this structure:
{
  "title": string,
  "subtitle": string,
  "overview": {
    "description": string,
    "prerequisites": Array<{ title: string, description: string, level: string }>,
    "learningOutcomes": Array<{ title: string, description: string, category: string }>,
    "totalDuration": string,
    "difficultyLevel": string,
    "skills": string[],
    "tools": string[]
  },
  "sections": Array<{
    "title": string,
    "description": string,
    "duration": string,
    "startTime": number, // timestamp in seconds
    "endTime": number,   // timestamp in seconds
    "lessons": Array<{
      "title": string,
      "duration": string,
      "description": string,
      "content": string,
      "startTime": number, // timestamp in seconds
      "endTime": number,   // timestamp in seconds
      "resources": Array<{
        "title": string,
        "type": string,
        "url": string,
        "description": string
      }>
    }>
  }>
}`.trim(),

  generateVideoSegments: (courseStructure: any) => `
Analyze the provided course structure and create optimal video segments.
The goal is to break down the main video into focused, logical segments 
that align with the course lessons.

Course Structure:
${JSON.stringify(courseStructure, null, 2)}

For each lesson:
1. Review the content and timestamps
2. Identify natural break points
3. Ensure each segment is:
   - Complete and self-contained
   - Focused on a single concept
   - Neither too short nor too long
4. Preserve important visual demonstrations
5. Include brief context from previous segment if needed

Return the segments as a JSON array:
{
  "segments": Array<{
    "lessonId": string,
    "title": string,
    "startTime": number,
    "endTime": number,
    "description": string,
    "keywords": string[],
    "context": string
  }>
}`.trim(),

  enhanceSegment: (segmentContent: string, context: string) => `
Review this video segment content and enhance it with additional context.

Content: ${segmentContent}
Previous Context: ${context}

Analyze and provide:
1. Key concepts covered
2. Important terminology
3. Prerequisites needed
4. Related concepts
5. Practical applications
6. Common misconceptions
7. Learning tips

Format as JSON:
{
  "concepts": string[],
  "terminology": Array<{ term: string, definition: string }>,
  "prerequisites": string[],
  "relatedTopics": string[],
  "applications": string[],
  "misconceptions": string[],
  "tips": string[]
}`.trim()
};