import { NextResponse } from 'next/server';
import { createAILogger } from '@/lib/ai/debug-logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CourseGenerationOptions } from '@/types/api';
import { Course, courseSchema } from '@/tools/googleAiCourseSchema';
import { ZodError } from 'zod';

// Create a logger for the API endpoint
const logger = createAILogger('google-adk-api');

/**
 * API endpoint to handle Google ADK course generation requests
 */
export async function POST(req: Request) {
  try {
    // Get API key from environment variables
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      logger.error('Missing Google AI API key in environment variables');
      return NextResponse.json(
        { message: 'Google AI API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const {
      systemPrompt,
      userPrompt,
      videoId,
      videoTitle,
      videoDescription,
      transcript,
      options = {}
    } = await req.json();

    // Validate required fields
    if (!videoId || !videoTitle || !systemPrompt || !userPrompt) {
      logger.error('Missing required fields in request body', { videoId, videoTitle });
      return NextResponse.json(
        { message: 'Missing required fields: videoId, videoTitle, systemPrompt, and userPrompt must be provided' },
        { status: 400 }
      );
    }

    logger.info('Starting ADK course generation', {
      videoId,
      videoTitle,
      options,
      transcriptLength: transcript?.length || 0
    });

    // Initialize Google Generative AI client
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the Gemini Pro model (as of April 2024, this is the best model for structured data generation)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: options.temperature || 0.2,
        maxOutputTokens: options.maxOutputTokens || 8192,
        topP: 0.95,
        topK: 40,
      },
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE',
        },
      ],
    });

    // Start the conversation with the system prompt
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        {
          role: 'model',
          parts: [{ text: 'I understand my task is to generate a well-structured course in JSON format based on video content. I will follow all the rules you provided.' }],
        },
      ],
    });

    // Get the AI response
    const result = await chat.sendMessage(userPrompt);
    const responseText = result.response.text();

    logger.debug('Received response from ADK', {
      responseLength: responseText.length,
      responsePreview: responseText.substring(0, 100) + '...',
    });

    // Process the response to extract valid JSON
    try {
      // Find JSON content (assuming it's wrapped in backticks or curly braces)
      let jsonContent = responseText;
      
      // If there are code blocks in the response, try to extract JSON
      if (responseText.includes('```json')) {
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonContent = jsonMatch[1].trim();
        }
      } else if (responseText.includes('```')) {
        const codeMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch && codeMatch[1]) {
          jsonContent = codeMatch[1].trim();
        }
      }

      // Parse the JSON content
      const courseData: Course = JSON.parse(jsonContent);
      
      // Validate the course data using Zod schema
      const validatedCourseData = courseSchema.parse(courseData);

      // Add videoId to the course data if not present
      const enrichedCourseData = {
        ...validatedCourseData,
        videoId: validatedCourseData.videoId || videoId
      };

      logger.info('Course generation successful', {
        videoId,
        title: validatedCourseData.title,
        sections: validatedCourseData.sections.length,
        resources: validatedCourseData.resources.length
      });

      // Return the course data
      return NextResponse.json({
        success: true,
        data: enrichedCourseData
      });
    } catch (error) {
      logger.error('Failed to parse AI response into valid course data', {
        error: error instanceof Error ? error.message : String(error),
        responsePreview: responseText.substring(0, 200) + '...'
      });

      // Provide a more specific error based on validation issues
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            message: 'Generated course data does not match schema',
            validationErrors: error.errors,
            rawResponse: responseText.substring(0, 1000) + '...' // Include a preview of the raw response for debugging
          },
          { status: 422 }
        );
      }

      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { 
            message: 'Failed to parse JSON from AI response',
            parseError: error.message,
            rawResponse: responseText.substring(0, 1000) + '...' // Include a preview of the raw response for debugging
          },
          { status: 422 }
        );
      }

      // Generic error
      return NextResponse.json(
        { message: 'Failed to process course data from AI response' },
        { status: 500 }
      );
    }
  } catch (error) {
    // Log the error
    logger.error('Error in Google ADK course generation', { 
      error: error instanceof Error ? error.message : String(error)
    });

    // Return error response
    return NextResponse.json(
      { message: `Failed to generate course: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}