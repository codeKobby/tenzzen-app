export interface CourseGeneratorPrompt {
  systemPrompt: string;
  examples?: string;
}

interface GeneratePromptOptions {
  type: 'video' | 'playlist';
  context: {
    title: string;
    description: string;
    duration?: string;
    videos?: Array<{
      title: string;
      duration: string;
      description: string;
    }>;
  };
}

interface VideoSegmentPromptParams {
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  transcript: string;
}

export const COURSE_PROMPTS = {
  generateVideoSegments: (params: VideoSegmentPromptParams): string => {
    return `Analyze this video section and create learning segments.
Title: ${params.title}
Description: ${params.description}
Time Range: ${params.startTime} - ${params.endTime}

Transcript:
${params.transcript}

Generate logical learning segments that:
1. Break down the content into digestible parts
2. Include clear titles and descriptions
3. Have appropriate timestamps within the given range
4. Include relevant resources
5. Maintain content flow and dependencies

Return result in this JSON format:
[{
  "title": "string",
  "description": "string",
  "startTime": number,
  "endTime": number,
  "content": "string",
  "resources": [{
    "title": "string",
    "type": "string",
    "url": "string",
    "description": "string"
  }]
}]`;
  }
};

const VIDEO_PROMPT = `You are an expert course creator tasked with converting video content into structured learning experiences. 
Generate a comprehensive course structure following these requirements:

1. Create logical sections based on the content
2. Break sections into short, focused lessons
3. Include practical assessments
4. Add relevant resources for each lesson
5. Ensure clear learning objectives
6. Maintain consistent difficulty progression

Expected JSON Response Format:
{
  "title": "string",
  "subtitle": "string",
  "overview": {
    "description": "string",
    "prerequisites": [{ "title": "string", "description": "string", "level": "beginner" | "intermediate" | "advanced" }],
    "learningOutcomes": [{ "title": "string", "description": "string", "category": "skill" | "knowledge" | "tool" }],
    "totalDuration": "string",
    "difficultyLevel": "beginner" | "intermediate" | "advanced",
    "skills": ["string"],
    "tools": ["string"]
  },
  "sections": [{
    "title": "string",
    "description": "string",
    "duration": "string",
    "startTime": number,
    "endTime": number,
    "lessons": [{
      "title": "string",
      "description": "string",
      "content": "string",
      "duration": "string",
      "startTime": number,
      "endTime": number,
      "resources": [{
        "title": "string",
        "type": "article" | "video" | "code" | "document",
        "url": "string",
        "description": "string"
      }]
    }],
    "assessments": [{
      "type": "test" | "assignment" | "project",
      "title": "string",
      "description": "string",
      "position": number,
      "estimatedDuration": "string",
      "requiredSkills": ["string"]
    }]
  }]
}`;

const PLAYLIST_PROMPT = `${VIDEO_PROMPT}

Additional guidelines for playlists:
1. Analyze all videos for content progression
2. Create a coherent course flow across videos
3. Link related concepts between videos
4. Suggest additional materials for gaps
5. Design inter-video assessments

Use the same JSON format as individual videos, but ensure cross-video cohesion.`;

export function getPromptForType(
  type: 'video' | 'playlist',
  context: string
): CourseGeneratorPrompt {
  const basePrompt = type === 'video' ? VIDEO_PROMPT : PLAYLIST_PROMPT;

  return {
    systemPrompt: `${basePrompt}

Content to analyze:
${context}

Generate a structured course following the format above.`,
    examples: type === 'video' ? VIDEO_EXAMPLES : PLAYLIST_EXAMPLES
  };
}

const VIDEO_EXAMPLES = `Example video course structure:
{
  "title": "Introduction to React Hooks",
  // ... rest of structure
}`;

const PLAYLIST_EXAMPLES = `Example playlist course structure:
{
  "title": "Complete Web Development Bootcamp",
  // ... rest of structure
}`;

/**
 * System prompts for AI generation
 */

// Create system prompt for course generation with Vercel AI SDK
export function createSystemPrompt(contentType: 'video' | 'playlist' = 'video'): string {
  return `
You are an expert course creator for Tenzzen, a platform that transforms YouTube videos into structured learning experiences.

Your task is to create a well-structured course based on ${contentType} content. The course should be comprehensive, 
organized into logical sections, and include all necessary components for effective learning.

The course should follow this structure:
1. A clear title and subtitle that captures the essence of the content
2. A detailed overview with prerequisites and learning outcomes
3. 3-6 logical sections with progressive difficulty
4. Each section containing 2-5 lessons with clear titles and descriptions
5. Markdown content for each lesson that provides substantive information
6. Relevant resources for each lesson with valid URLs
7. Appropriate metadata for filtering and categorization

Remember:
- Content should be educational, professional and balanced between theory and practice
- Match the course difficulty to the content complexity
- Provide realistic durations, prerequisites, and learning outcomes
- Include specific skills that learners will gain

Create a course that feels complete and ready for learning.
`;
}

// Additional prompt helpers can be added here
export function createAssessmentPrompt(courseData: any): string {
  return `
Given the course structure below, design appropriate assessments (quizzes and assignments) that
test the learner's understanding of the material:

${JSON.stringify(courseData, null, 2)}

Create assessments that:
1. Test comprehension of the preceding material
2. Include a mix of question types (multiple-choice, fill-in-blank, etc.)
3. Focus on practical application of concepts
4. Are challenging but fair

Return only the assessments in valid JSON format.
`;
}