import { z } from 'zod';
import { courseSchema, sectionSchema, lessonSchema, resourceSchema } from './googleAiCourseSchema';
import { generateCourseContent } from './googleAiClient';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Define our own tool creation function since @vercel/ai-sdk is not available
function createTool<T extends z.ZodType<any, any>>({ 
  name, 
  description, 
  schema, 
  execute 
}: {
  name: string;
  description: string;
  schema: T;
  execute: (args: z.infer<T>) => Promise<any>;
}) {
  return { name, description, schema, execute };
}

// Tool for generating complete course data
export const generateCourseDataTool = createTool({
  name: 'generate_course_data',
  description: 'Generate a complete course structure from a video including sections, lessons, and resources',
  schema: z.object({
    videoId: z.string().describe('The YouTube video ID'),
    videoTitle: z.string().describe('The title of the video'),
    videoDescription: z.string().describe('The description of the video'),
    transcript: z.string().describe('The transcript of the video'),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().describe('The difficulty level of the course'),
    category: z.string().optional().describe('The main category of the course'),
  }),
  execute: async ({ 
    videoId, 
    videoTitle, 
    videoDescription, 
    transcript, 
    difficulty, 
    category 
  }: {
    videoId: string;
    videoTitle: string;
    videoDescription: string;
    transcript: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    category?: string;
  }) => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google AI API key is missing from environment variables');
    }

    // Create the prompt for course generation
    const prompt = `
    Generate a very well structured course from the video using the transcript. 
    The generation must include at least one test and assignment and a project at the end. 
    
    Do not include test questions or assignments, just state after which lesson where you deem fit to have a test or assignment.
    For instance, lesson 1, lesson 2, test, lesson 3, assignment lesson 5, test, project. The projects are the last in the structure.
    
    The structure sections should be titled sections with lessons, grouped based on common grounds, concepts, topics, ideas, etc. 
    Also include resources in the output, first any resource in the description, mentioned in the video or any additional resource necessary for the learner.
    
    There should be a main category, and then tags. For example: "Programming" and the tags could be "Javascript", "Nextjs", "MERN stack" 
    or "Guitar" and the tags would be "bar chords", "blues scales", "jazz".
    
    In the resources, add additional resources that are very much relevant and related, and on very practical courses like programming, 
    you can add links to practice platforms like codepen, etc.
    
    ${difficulty ? `The difficulty level should be: ${difficulty}` : 'Determine the appropriate difficulty level.'}
    ${category ? `The main category should be: ${category}` : 'Determine the appropriate category.'}
    
    Output ONLY valid JSON.
    `;

    return await generateCourseContent(apiKey, prompt, transcript, videoDescription, videoTitle);
  }
});

// Tool for analyzing video transcript to identify chapters/sections
export const analyzeTranscriptTool = createTool({
  name: 'analyze_transcript',
  description: 'Analyze a video transcript to identify natural sections, chapters, or topic transitions',
  schema: z.object({
    transcript: z.string().describe('The transcript of the video to analyze'),
    videoTitle: z.string().describe('The title of the video'),
    approximateSections: z.number().optional().describe('Approximate number of sections to identify')
  }),
  execute: async ({ 
    transcript, 
    videoTitle, 
    approximateSections 
  }: {
    transcript: string;
    videoTitle: string;
    approximateSections?: number;
  }) => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google AI API key is missing from environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    const result = await model.generateContent(`Analyze this video transcript for "${videoTitle}" and identify ${approximateSections || '3-5'} major sections or chapters.
      For each section, provide:
      1. A clear title
      2. Start and end times (in seconds) 
      3. A brief description of the content
      4. Key points covered
      
      Return the analysis as a JSON array of sections.
      
      Transcript: ${transcript.substring(0, 25000)}`);
    
    // Access text content correctly
    const responseText = result.response.text();
    
    try {
      // Clean up the response to extract valid JSON
      const jsonStr = responseText.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing section data:', error);
      throw new Error('Failed to analyze transcript into sections');
    }
  }
});

// Tool for finding resources related to a course topic
export const findRelatedResourcesTool = createTool({
  name: 'find_related_resources',
  description: 'Find related resources (articles, tutorials, tools, etc.) for a course topic',
  schema: z.object({
    topic: z.string().describe('The main topic of the course'),
    subtopics: z.array(z.string()).optional().describe('Subtopics or tags related to the course'),
    videoDescription: z.string().optional().describe('The description of the video which might contain resource links'),
    resourceTypes: z.array(z.enum(['article', 'book', 'tutorial', 'tool', 'video', 'code', 'documentation', 'blog'])).optional().describe('Types of resources to find')
  }),
  execute: async ({ 
    topic, 
    subtopics, 
    videoDescription, 
    resourceTypes 
  }: {
    topic: string;
    subtopics?: string[];
    videoDescription?: string;
    resourceTypes?: Array<'article' | 'book' | 'tutorial' | 'tool' | 'video' | 'code' | 'documentation' | 'blog'>;
  }) => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google AI API key is missing from environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Extract any links from the video description
    let extractedLinks: string[] = [];
    if (videoDescription) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const matches = videoDescription.match(urlRegex);
      if (matches) {
        extractedLinks = matches;
      }
    }

    const result = await model.generateContent(`Find high-quality resources related to "${topic}" ${subtopics ? `and subtopics: ${subtopics.join(', ')}` : ''}.
      
      ${extractedLinks.length > 0 ? `First, consider these links extracted from the video description: ${extractedLinks.join(', ')}` : ''}
      
      For each resource, provide:
      1. Title
      2. URL
      3. Brief description
      4. Type (${resourceTypes?.join(', ') || 'any appropriate type'})
      
      Return 5-10 highly relevant resources as a JSON array that would help learners master this topic.
      Each resource must include title, url, description, and type fields.`);
    
    // Access text content correctly
    const responseText = result.response.text();
    
    try {
      // Clean up the response to extract valid JSON
      const jsonStr = responseText.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing resource data:', error);
      throw new Error('Failed to find related resources');
    }
  }
});

// Tool for generating a project assessment based on course content
export const generateProjectTool = createTool({
  name: 'generate_project',
  description: 'Generate a capstone project based on the course content',
  schema: z.object({
    courseTitle: z.string().describe('The title of the course'),
    courseDescription: z.string().describe('The description of the course'),
    sections: z.array(z.object({
      title: z.string(),
      keyPoints: z.array(z.string())
    })).describe('The course sections with key points'),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('The difficulty level of the course')
  }),
  execute: async ({ 
    courseTitle, 
    courseDescription, 
    sections, 
    difficulty 
  }: {
    courseTitle: string;
    courseDescription: string;
    sections: Array<{ title: string; keyPoints: string[] }>;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  }) => {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google AI API key is missing from environment variables');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // Extract key points from all sections to understand course scope
    const allKeyPoints = sections.flatMap((section: { title: string; keyPoints: string[] }) => section.keyPoints);
    
    const result = await model.generateContent(`Generate a comprehensive capstone project for a ${difficulty} level course titled "${courseTitle}" with description: "${courseDescription}".
      
      The course covers these key points:
      ${allKeyPoints.map((point: string) => `- ${point}`).join('\n')}
      
      Create a project that:
      1. Integrates multiple concepts from the course
      2. Has clear instructions and requirements
      3. Includes evaluation criteria
      4. Specifies required deliverables
      
      Return the project as a JSON object with these fields:
      - id: "project"
      - title: A clear, descriptive project title
      - description: A detailed overview of the project
      - Instructions: Array of step-by-step instructions
      - "Evaluation criteria": Array of criteria for assessment
      - "Required deliverables": Array of specific items to be submitted`);
    
    // Access text content correctly
    const responseText = result.response.text();
    
    try {
      // Clean up the response to extract valid JSON
      const jsonStr = responseText.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing project data:', error);
      throw new Error('Failed to generate project assessment');
    }
  }
});