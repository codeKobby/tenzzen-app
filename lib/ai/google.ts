import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { logger } from './debug-logger';
import { GENERATION_CONFIG } from './config';

// Initialize the model with safety settings
const baseModel = google('gemini-1.5-pro-latest', {
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
});

// Model with search grounding enabled
const groundedModel = google('gemini-1.5-pro-latest', {
  useSearchGrounding: true,
  dynamicRetrievalConfig: {
    mode: 'MODE_DYNAMIC',
    dynamicThreshold: 0.8
  }
});

export interface GenerateContentOptions {
  useGrounding?: boolean;
  abortSignal?: AbortSignal;
}

export async function generateContent(
  prompt: string,
  options: GenerateContentOptions = {}
) {
  try {
    logger.debug('api', 'Generating content', { prompt, options });

    // Select model based on options
    const model = options.useGrounding ? groundedModel : baseModel;

    // Generate content using AI SDK's generateText
    const { text, providerMetadata } = await generateText({
      model,
      prompt,
      maxTokens: GENERATION_CONFIG.maxOutputTokens,
      temperature: GENERATION_CONFIG.temperature,
      topP: GENERATION_CONFIG.topP,
      topK: GENERATION_CONFIG.topK,
      abortSignal: options.abortSignal
    });

    // Log metadata if available
    if (providerMetadata?.google) {
      logger.debug('api', 'Generation metadata', {
        groundingMetadata: providerMetadata.google.groundingMetadata,
        safetyRatings: providerMetadata.google.safetyRatings
      });
    }

    return { result: text };

  } catch (error) {
    // Log and rethrow error
    logger.error('api', 'Generation failed', error instanceof Error ? error : new Error('Unknown error'));
    throw error;
  }
}

// Export configured models
export { baseModel as model, groundedModel };