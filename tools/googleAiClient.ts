import { GoogleGenerativeAI } from '@google/generative-ai';
import { Course, courseSchema } from './googleAiCourseSchema';
import { generateObject } from 'ai';
import { z } from "zod";
import { createAILogger } from "@/lib/ai/debug-logger";

// Create a logger for Google AI operations
const logger = createAILogger('google-ai-client');

// Initialize Google AI with your API key
export const createGoogleAI = (apiKey: string) => {
  if (!apiKey) {
    throw new Error('Google AI API key is required');
  }
  
  return new GoogleGenerativeAI(apiKey);
};

// Get Gemini Pro model
export const getGeminiProModel = (genAI: GoogleGenerativeAI) => {
  return genAI.getGenerativeModel({ model: 'gemini-pro' });
};

// Generate course content using Google Generative AI
export async function generateCourseContent(
  apiKey: string,
  prompt: string,
  videoTranscript: string,
  videoDescription: string,
  videoTitle: string
): Promise<Course> {
  try {
    // Initialize Google AI
    const genAI = createGoogleAI(apiKey);
    const model = getGeminiProModel(genAI);

    // Context for the model
    const context = `
      Video Title: ${videoTitle}
      Video Description: ${videoDescription}
      Transcript: ${videoTranscript.substring(0, 100000)} // Truncate if too long
    `;

    // Generate structured content using ADK
    const { object: courseData } = await generateObject({
      model: {
        doGenerate: async (params: { prompt: string }) => {
          const result = await model.generateContent(params.prompt);
          const candidate = result.response;
          return {
            content: candidate.text(),
          };
        }
      },
      schema: courseSchema,
      prompt: `${prompt}\n\n${context}`,
    });

    return courseData as Course;
  } catch (error) {
    console.error('Error generating course content:', error);
    throw new Error('Failed to generate course content with Google AI');
  }
}

/**
 * Generate structured data using Google's Gemini AI models
 * 
 * @param apiKey Google AI API key
 * @param schema Zod schema to validate and parse the response
 * @param prompt The system prompt defining the task
 * @param context Additional context for the AI model
 * @returns Structured data that conforms to the schema
 */
export async function generateStructuredData<T>(
  apiKey: string,
  schema: z.ZodType<T>,
  prompt: string,
  context: string
): Promise<T> {
  try {
    // Initialize the Google AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the Gemini Pro model, which is well-suited for structured data generation
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.2,  // Low temperature for deterministic, structured outputs
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseType: "json",  // Request JSON response
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

    // Start the chat with our system prompt
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            { text: `
System: You are an expert in creating structured data. Your task is to generate JSON content that strictly adheres to the specified schema.

Here's how you should approach this:
1. Analyze the provided context carefully
2. Generate a well-structured response that matches the requested schema
3. Always use valid JSON format
4. Return ONLY the JSON response without any additional text, explanation, or code blocks

${prompt}
            ` },
          ],
        },
        {
          role: "model",
          parts: [
            { text: "I understand. I will generate valid JSON data following the specified schema based on the context you provide. I'll return only the structured JSON data without any explanations or markdown formatting." },
          ],
        },
      ],
    });

    // Send the context to the model
    logger.info('Sending request to Google AI', { contextLength: context.length });
    
    try {
      const result = await chat.sendMessage(context);
      const response = result.response;
      const responseText = response.text();
      
      // Check if the response could be HTML (common for error pages)
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
        logger.error('Received HTML response instead of JSON', {
          responsePreview: responseText.substring(0, 200)
        });
        throw new Error('API returned HTML instead of JSON. The API service might be experiencing issues.');
      }
      
      // Process the response to handle various formats
      let jsonString = responseText;
      
      // Check if the response is wrapped in code blocks and extract if needed
      if (responseText.includes('```json')) {
        const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          jsonString = match[1].trim();
        }
      } else if (responseText.includes('```')) {
        const match = responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          jsonString = match[1].trim();
        }
      }

      // Try parsing the JSON with better error handling
      try {
        const parsedData = JSON.parse(jsonString);
        
        // Validate against the provided schema
        const validatedData = schema.parse(parsedData);
        
        logger.info('Successfully generated structured data');
        return validatedData;
      } catch (parseError) {
        logger.error('Failed to parse response as JSON', { 
          error: parseError instanceof Error ? parseError.message : String(parseError),
          responsePreview: jsonString.substring(0, 200)
        });
        throw new Error('Generated data is not valid JSON. The model returned an invalid response.');
      }
    } catch (apiError) {
      logger.error('API request failed', {
        error: apiError instanceof Error ? apiError.message : String(apiError)
      });
      
      // Enhanced error message with API status details if available
      throw new Error(`Google AI API request failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
    }
  } catch (error) {
    // Handle parsing/validation errors
    if (error instanceof z.ZodError) {
      logger.error('Schema validation failed', { errors: error.errors });
      throw new Error(`Generated data does not match schema: ${error.message}`);
    }
    
    // Pass through our custom errors
    if (error instanceof Error) {
      throw error;
    }
    
    // Handle other errors
    logger.error('Error generating structured data', { 
      error: typeof error === 'string' ? error : 'Unknown error'
    });
    
    throw new Error('Failed to generate structured data');
  }
}

// Function to stream structured JSON data with Google AI (useful for real-time UI updates)
export async function* streamStructuredData<T>(
  apiKey: string, 
  schema: any, 
  prompt: string, 
  additionalContext: string = ''
): AsyncGenerator<Partial<T>> {
  try {
    // Initialize Google AI
    const genAI = createGoogleAI(apiKey);
    const model = getGeminiProModel(genAI);
    
    // Set up streaming options for Google's model
    const generationConfig = {
      temperature: 0.1,    // Lower temperature for more deterministic outputs in structured data
      maxOutputTokens: 4096,
      topK: 40,
      topP: 0.9,
    };

    // Enhance prompt with explicit instructions for JSON formatting
    const enhancedPrompt = `${prompt}${additionalContext ? '\n\n' + additionalContext : ''}\n\n
    Important: Your response must be valid JSON that conforms to the schema provided.`;
  } catch (error) {
    console.error('Error streaming structured data:', error);
    throw new Error(`Failed to stream structured data with Google AI: ${error instanceof Error ? error.message : String(error)}`);
  }
}