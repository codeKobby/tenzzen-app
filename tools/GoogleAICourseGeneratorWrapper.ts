import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateStructuredData } from './googleAiClient';
import { Course, courseSchema } from './googleAiCourseSchema';
import { createAILogger } from '@/lib/ai/debug-logger';

const logger = createAILogger('google-ai-course-generator');

interface CourseGenerationOptions {
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  category?: string;
  includeProject?: boolean;
  includeAssessments?: boolean;
}

/**
 * Wrapper class for generating courses with Google AI
 */
export class GoogleAICourseGenerator {
  private apiKey: string;
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    logger.debug('Initialized Google AI Course Generator');
  }

  /**
   * Generate a complete course with sections, lessons, and resources
   */
  async generateCompleteCourse(
    videoId: string,
    videoTitle: string,
    videoDescription: string,
    options: CourseGenerationOptions = {}
  ): Promise<Course> {
    try {
      logger.info('Starting complete course generation', {
        videoId,
        videoTitle,
        options
      });

      const difficulty = options.difficulty || 'Beginner'; // Default to Beginner difficulty
      const category = options.category || this.determineCategoryFromTitle(videoTitle);

      // Build the system prompt for course generation
      const prompt = this.buildCoursePrompt(
        videoTitle,
        difficulty,
        category,
        options.includeProject,
        options.includeAssessments
      );

      // Context for the AI model
      const context = `
        VIDEO TITLE: ${videoTitle}
        VIDEO DESCRIPTION: ${videoDescription || "No description available"}
      `;

      // Generate the course content
      logger.debug('Sending course generation request to Google AI', {
        promptLength: prompt.length,
        contextLength: context.length
      });

      const courseData = await generateStructuredData<Course>(
        this.apiKey,
        courseSchema,
        prompt,
        context
      );

      logger.info('Course generation successful', {
        title: courseData.title,
        sections: courseData.sections.length
      });

      // Add video ID to the generated course
      const enrichedCourseData = {
        ...courseData,
        videoId
      };

      return enrichedCourseData as Course;
    } catch (error) {
      logger.error('Course generation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Generate course through API route instead of direct API access
   * This helps with environment variable management and error handling
   */
  async generateCourseViaAPI(
    videoId: string,
    videoTitle: string,
    videoDescription: string,
    options: CourseGenerationOptions = {}
  ): Promise<Course> {
    try {
      logger.info('Starting course generation via API route', {
        videoId,
        videoTitle
      });

      // Prepare API request
      const payload = {
        videoId,
        videoTitle,
        videoDescription,
        difficulty: options.difficulty || 'Beginner', // Default to Beginner difficulty
        category: options.category,
        includeProject: options.includeProject,
        includeAssessments: options.includeAssessments
      };

      // Call the API route 
      const response = await fetch('/api/course-generation/google-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      // Check content type to detect HTML responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error("Received HTML instead of JSON. The API service might be having authentication issues.");
      }

      // Handle error responses
      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error || errorData.message) {
            errorMessage = errorData.error || errorData.message;
          }
        } catch (jsonError) {
          // If we can't parse JSON, try to get text content
          try {
            const textError = await response.text();
            if (textError && textError.length < 200) {
              errorMessage = textError;
            }
          } catch (textError) {
            // Keep the status error if text fetch fails
          }
        }

        throw new Error(errorMessage);
      }

      // Parse the response
      const result = await response.json();

      if (!result.data) {
        throw new Error("No course data returned from API");
      }

      logger.info('Successfully received course data from API', {
        title: result.data.title,
        sections: result.data.sections?.length
      });

      return result.data as Course;
    } catch (error) {
      logger.error('API route course generation failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Verify if the Google AI API key is valid
   */
  async verifyApiKey(): Promise<boolean> {
    try {
      // Get the Gemini model
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
      });

      // Send a simple request to verify the API key
      const result = await model.generateContent('Test request to verify API key');

      // If we reach here, the API key is valid
      return true;
    } catch (error) {
      logger.error('API key verification failed', {
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Builds the course generation prompt based on provided parameters
   */
  private buildCoursePrompt(
    videoTitle: string,
    difficulty: string,
    category: string,
    includeProject = true,
    includeAssessments = true
  ): string {
    return `
      You are an expert education content creator with years of experience in instructional design.
      
      TASK:
      Create a comprehensive, structured course based on the video content I'll provide. The course should be titled appropriately based on the video content, but you can improve upon the title if needed.
      
      COURSE PARAMETERS:
      - Title: Create an engaging title based on "${videoTitle}"
      - Difficulty Level: ${difficulty}
      - Category: ${category}
      
      COURSE STRUCTURE:
      1. Create 3-7 main sections based on natural divisions in the content
      2. For each section, create 2-5 lessons that break down the section topic
      3. Each lesson should have key points that a learner should understand
      4. Include timestamps for when topics start in the video when possible
      5. ${includeProject ? 'Include a final project that tests comprehensive understanding' : 'No project required'}
      6. ${includeAssessments ? 'Include appropriate assessments through the course' : 'No assessments required'}
      
      REQUIREMENTS:
      - Create course content that accurately reflects the video while being structured for learning
      - Use professional, engaging language appropriate for the subject matter
      - Ensure lessons build logically upon each other
      - Include relevant resources that supplement the video content
      
      Return the course in the exact schema format required, with no additional explanation or commentary.
    `;
  }

  /**
   * Simple category determination based on video title
   */
  private determineCategoryFromTitle(title: string): string {
    const titleLower = title.toLowerCase();

    const categoryMap: Record<string, string[]> = {
      'Programming': ['code', 'programming', 'javascript', 'python', 'java', 'html', 'css', 'react', 'angular', 'vue', 'node', 'typescript'],
      'Design': ['design', 'ux', 'ui', 'photoshop', 'illustrator', 'figma', 'sketch'],
      'Business': ['business', 'marketing', 'sales', 'management', 'entrepreneurship', 'startup'],
      'Finance': ['money', 'finance', 'investing', 'financial', 'stock', 'crypto', 'wealth', 'rich', 'budget'],
      'Data Science': ['data', 'machine learning', 'ai', 'artificial intelligence', 'statistics', 'analytics'],
      'Mathematics': ['math', 'calculus', 'algebra', 'geometry', 'statistics'],
      'Science': ['science', 'physics', 'chemistry', 'biology', 'astronomy'],
      'Language': ['language', 'english', 'spanish', 'french', 'german', 'japanese', 'chinese'],
      'Arts': ['art', 'music', 'painting', 'drawing', 'sculpture', 'photography'],
      'History': ['history', 'ancient', 'medieval', 'renaissance', 'modern'],
      'Technology': ['tech', 'computer', 'hardware', 'software', 'gadget', 'cybersecurity', 'hacking'],
      'Personal Development': ['habits', 'productivity', 'growth', 'mindset', 'success', 'motivation', 'self-help'],
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        return category;
      }
    }

    // Default category
    return 'General';
  }
}