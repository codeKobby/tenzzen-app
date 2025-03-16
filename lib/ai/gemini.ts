import { GoogleGenerativeAI } from '@google/generative-ai';
import { GENERATION_CONFIG } from './config';
import { logger } from './debug-logger';

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

// Get the model
const model = genAI.getGenerativeModel({
  model: "gemini-pro",
  generationConfig: GENERATION_CONFIG
});

interface GenerateContentOptions {
  abortSignal?: AbortSignal;
}

export async function generateContent(
  prompt: string,
  options: GenerateContentOptions = {}
) {
  try {
    logger.debug('api', 'Generating content with Gemini', { prompt });

    // Generate content with streaming
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }, {
      signal: options.abortSignal
    });

    // Process stream chunks
    const chunks: string[] = [];
    for await (const chunk of result.stream) {
      // Check for abort signal
      if (options.abortSignal?.aborted) {
        logger.info('api', 'Generation aborted by user');
        throw new Error('Generation cancelled');
      }

      const text = chunk.text();
      if (text) {
        chunks.push(text);
        logger.debug('api', 'Received chunk', { text });
      }
    }

    // Combine chunks
    const combinedResult = chunks.join('');
    logger.info('api', 'Generation completed', {
      promptLength: prompt.length,
      responseLength: combinedResult.length
    });

    return { result: combinedResult };

  } catch (error) {
    // Handle safety filters
    if (error instanceof Error) {
      if (error.message.includes('blocked')) {
        logger.warn('api', 'Content blocked by safety filters', error);
        throw new Error('Content blocked by safety filters');
      }

      // Rate limiting
      if (error.message.includes('quota') || error.message.includes('rate')) {
        logger.warn('api', 'Rate limit exceeded', error);
        throw new Error('Rate limit exceeded');
      }

      // Content filters
      if (error.message.includes('safety') || error.message.includes('harm')) {
        logger.warn('api', 'Content safety violation', error);
        throw new Error('Content safety check failed');
      }
    }

    // Log and rethrow other errors
    logger.error('api', 'Generation failed', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

export type { GenerateContentOptions };