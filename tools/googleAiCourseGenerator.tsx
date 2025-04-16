import { GoogleGenerativeAI } from '@google/generative-ai';
import { Course } from './googleAiCourseSchema';
import { createAILogger } from '@/lib/ai/debug-logger';

// Create a logger for Google AI operations
const logger = createAILogger('google-ai-generator');

// Options for course generation
interface CourseGenerationOptions {
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  includeProject?: boolean;
  includeAssessments?: boolean;
}

/**
 * GoogleAiCourseGenerator handles the integration with Google's AI models
 * to generate structured course content from YouTube videos
 */
export class GoogleAiCourseGenerator {
  private apiKey: string;
  private model: any;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Google AI API key is required');
    }
    this.apiKey = apiKey;

    // Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(apiKey);

    // Get the Gemini Pro model for structured course generation
    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.2,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    });
  }

  /**
   * Generate a complete course structure from a YouTube video
   */
  async generateCourse(
    videoId: string,
    videoTitle: string,
    videoDescription: string,
    transcript: string,
    options: CourseGenerationOptions = {}
  ): Promise<Course> {
    const {
      difficulty,
      category,
      includeProject = true,
      includeAssessments = true
    } = options;

    logger.info(`Generating course for video ID: ${videoId}`, {
      title: videoTitle,
      options
    });

    try {
      // Create system prompt for structured course generation
      const systemPrompt = `
You are an expert instructional designer specialized in creating structured courses from video content.
Your task is to analyze a YouTube video's transcript and metadata to create a comprehensive course structure.

IMPORTANT RULES:
1. Output MUST be valid JSON conforming to the course structure schema
2. Every section must have at least one lesson
3. Include timestamps (in seconds) for each section and lesson
4. Generate practical assessments that test understanding
5. Include relevant resources mentioned in the video and supplementary materials
6. Match difficulty level to content complexity: Beginner, Intermediate, or Advanced
7. Create a project component that applies the knowledge gained`;

      // Create the user prompt with video details and transcript
      const userPrompt = `
Create a structured course from this YouTube video:

VIDEO TITLE: ${videoTitle}
VIDEO ID: ${videoId}
${difficulty ? `DIFFICULTY: ${difficulty}` : ''}
${category ? `CATEGORY: ${category}` : ''}

VIDEO DESCRIPTION:
${videoDescription || 'No description available'}

TRANSCRIPT:
${transcript.substring(0, 50000)} ${transcript.length > 50000 ? '(truncated)' : ''}

${includeAssessments ? 'Include appropriate quizzes and assessments throughout the course.' : ''}
${includeProject ? 'Design a practical project that applies the knowledge from this course.' : ''}

Format the response as valid JSON with this structure:
{
  "title": "Course title",
  "description": "Comprehensive description",
  "category": "Main topic area",
  "tags": ["tag1", "tag2"],
  "difficulty": "Beginner|Intermediate|Advanced",
  "prerequisites": ["prerequisite1", "prerequisite2"],
  "objectives": ["objective1", "objective2"],
  "overviewText": "Course overview",
  "resources": [
    {
      "title": "Resource title",
      "url": "https://example.com",
      "description": "Resource description",
      "type": "documentation|tutorial|video|article|code|blog"
    }
  ],
  "sections": [
    {
      "id": "section1",
      "title": "Section title",
      "description": "Section description",
      "startTime": 0,
      "endTime": 120,
      "objective": "Section learning objective",
      "keyPoints": ["key point 1", "key point 2"],
      "lessons": [
        {
          "id": "lesson1",
          "title": "Lesson title",
          "description": "Lesson description",
          "startTime": 0,
          "endTime": 60,
          "keyPoints": ["key point 1", "key point 2"]
        }
      ],
      "assessment": "test|assignment"
    }
  ],
  "project": {
    "id": "project1",
    "title": "Project title",
    "description": "Project description",
    "Instructions": ["step 1", "step 2"],
    "Evaluation criteria": ["criterion 1", "criterion 2"],
    "Required deliverables": ["deliverable 1", "deliverable 2"]
  }
}`;

      // Start the chat with the system prompt
      const chat = this.model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand. I will create a structured course in valid JSON format from the video content you provide, following all the rules you specified.' }],
          },
        ],
      });

      // Generate the course structure
      const result = await chat.sendMessage(userPrompt);
      const responseText = result.response.text();

      // Extract JSON from the response
      let jsonContent = responseText;

      // Handle responses where JSON might be wrapped in code blocks
      if (responseText.includes('```json')) {
        const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          jsonContent = match[1].trim();
        }
      } else if (responseText.includes('```')) {
        const match = responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          jsonContent = match[1].trim();
        }
      }

      // Parse the JSON content
      const courseData = JSON.parse(jsonContent);

      // Add videoId to the generated course data
      const enrichedCourseData = {
        ...courseData,
        videoId
      };

      logger.info('Course generation successful', {
        title: courseData.title,
        sections: courseData.sections?.length || 0
      });

      return enrichedCourseData;
    } catch (error) {
      logger.error('Error generating course structure:', error);

      // Generate a fallback course on error
      return this.generateFallbackCourse(videoId, videoTitle, videoDescription, options);
    }
  }

  /**
   * Generate a fallback course when the main generation fails
   */
  private generateFallbackCourse(
    videoId: string,
    videoTitle: string,
    videoDescription: string,
    options: CourseGenerationOptions
  ): Course {
    logger.info('Generating fallback course data', { videoId, videoTitle });

    // Basic fallback course structure
    const fallbackCourse: Course = {
      title: videoTitle || 'Untitled Course',
      description: videoDescription || 'No description available',
      videoId: videoId,
      category: options.category || 'General',
      tags: [options.category || 'General'],
      difficulty: options.difficulty || 'Beginner',
      prerequisites: ['No specific prerequisites required'],
      objectives: ['Understand the key concepts presented in this video'],
      overviewText: 'This course provides a structured overview of the video content.',
      resources: [
        {
          title: 'YouTube Source Video',
          url: `https://www.youtube.com/watch?v=${videoId}`,
          description: 'Original video source',
          type: 'video'
        }
      ],
      sections: [
        {
          id: 'section1',
          title: 'Introduction',
          description: 'Overview of the main concepts covered in the video',
          startTime: 0,
          endTime: 60,
          objective: 'Understand the core concepts',
          keyPoints: ['Basic overview', 'Key terminology'],
          lessons: [
            {
              id: 'lesson1',
              title: 'Getting Started',
              description: 'Introduction to the topic',
              startTime: 0,
              endTime: 30,
              keyPoints: ['Introduction', 'Overview']
            },
            {
              id: 'lesson2',
              title: 'Core Concepts',
              description: 'Understanding the main ideas',
              startTime: 31,
              endTime: 60,
              keyPoints: ['Main concepts', 'Basic principles']
            }
          ],
          assessment: 'test'
        }
      ],
      project: options.includeProject ? {
        id: 'project',
        title: 'Practice Project',
        description: 'Apply what you learned from the video',
        Instructions: ['Review the video content', 'Apply the concepts to a practical example'],
        "Evaluation criteria": ['Understanding of core concepts', 'Application of knowledge'],
        "Required deliverables": ['Implementation based on video concepts', 'Brief reflection']
      } : undefined
    };

    return fallbackCourse;
  }

  /**
   * Check if the Google AI API key is valid
   */
  async verifyApiKey(): Promise<boolean> {
    try {
      // Make a simple request to verify the API key
      const result = await this.model.generateContent('Testing API key validity');
      return true;
    } catch (error) {
      logger.error('API key verification failed:', error);
      return false;
    }
  }
}