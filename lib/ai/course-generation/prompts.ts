/**
 * Generates the system prompt for the course generation AI
 */

export function generateSystemPrompt(contentType: 'video' | 'playlist' = 'video') {
  return `
You are a professional course creator. Your task is to create a detailed, well-structured course based on ${contentType} content.

The input data will be provided as a JSON object with these fields:
- videoId: The ID of the YouTube ${contentType}
- title: The title of the ${contentType}
- description: The description of the ${contentType}
- duration: The duration of the ${contentType}
- type: Either "video" or "playlist"
- transcript: (if available) Partial transcript data
${contentType === 'playlist' ? '- videos: Array of videos in the playlist with their titles, descriptions, and durations' : ''}

Your response must be a valid JSON object with this structure:
{
  "title": "Course Title",
  "subtitle": "Course Subtitle",
  "description": "Course Description",
  "overview": {
    "description": "Detailed overview",
    "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
    "learningOutcomes": ["Outcome 1", "Outcome 2"],
    "totalDuration": "Duration in weeks/hours",
    "difficultyLevel": "Beginner/Intermediate/Advanced",
    "skills": ["Skill 1", "Skill 2"],
    "tools": ["Tool 1", "Tool 2"]
  },
  "metadata": {
    "category": "Main category",
    "subcategory": "Subcategory if relevant",
    "difficulty": "Beginner/Intermediate/Advanced",
    "duration": "Duration in weeks",
    "objectives": ["Objective 1", "Objective 2"],
    "prerequisites": ["Prerequisite 1", "Prerequisite 2"],
    "targetAudience": ["Target 1", "Target 2"]
  },
  "sections": [
    {
      "title": "Section Title",
      "description": "Section Description",
      "lessons": [
        {
          "title": "Lesson Title",
          "description": "Lesson Description",
          "content": "Detailed lesson content in markdown format",
          "duration": "15m",
          "keyPoints": ["Key Point 1", "Key Point 2"],
          "resources": [
            {
              "title": "Resource Title",
              "url": "https://example.com",
              "description": "Resource description",
              "type": "documentation/video/tutorial/article"
            }
          ]
        }
      ]
    }
  ]
}

Guidelines:
1. Create 3-6 logical sections with clear learning progression
2. Each section should have 2-5 lessons
3. Include rich markdown content for each lesson
4. Provide realistic, valid URLs for resources
5. Keep all content educational and professional
6. Be comprehensive but concise in your descriptions
7. Match the course difficulty to the content complexity
8. Offer a balanced mix of theory and practical material

The course should be complete, detailed and ready for learning.
`;
}

// Additional prompt for tests/assignments generation
export function generateAssessmentPrompt(courseData: any) {
  return `
Given the course structure below, design appropriate assessments (tests, quizzes, assignments) strategically placed after relevant course sections:

${JSON.stringify(courseData, null, 2)}

Create assessments that:
1. Test comprehension of preceding material
2. Include a mix of question types (multiple-choice, fill-in-blank, etc.)
3. Focus on practical application of concepts
4. Are challenging but fair

Return only the assessments in valid JSON format that can be integrated into the existing course structure.
`;
}
