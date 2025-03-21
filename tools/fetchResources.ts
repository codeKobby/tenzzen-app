import { logger } from '@/lib/ai/debug-logger';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Schema for resource extraction
const resourceSchema = z.object({
  title: z.string(),
  type: z.enum(['article', 'video', 'code', 'document']),
  url: z.string().url(),
  description: z.string()
});

export type Resource = z.infer<typeof resourceSchema>;

const googleModel = google('gemini-1.5-pro-latest', {
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

export interface ResourceParams {
  content: string;
  description?: string;
  maxResults?: number;
  temperature?: number;
}

export async function fetchResources({
  content,
  description = '',
  maxResults = 5,
  temperature = 0.7
}: ResourceParams): Promise<Resource[]> {
  try {
    const result = await generateText({
      model: googleModel,
      maxTokens: 1024,
      temperature,
      messages: [{
        role: 'user',
        content: `
Find relevant resources from this content:

${content}

Additional context:
${description}

Extract up to ${maxResults} resources including:
- Documentation links
- Code examples
- Tutorial videos
- Related articles

For each resource:
1. Extract or generate a descriptive title
2. Determine the resource type (article, video, code, document)
3. Get the URL if present, or suggest a relevant one
4. Write a brief description of what it offers
`
      }],
      tools: {
        extractResources: {
          description: "Extract resources from content",
          parameters: z.array(resourceSchema)
        }
      },
      toolChoice: {
        type: 'tool',
        toolName: 'extractResources'
      }
    });

    if (!result.toolCalls?.[0]?.args) {
      throw new Error('No resources extracted');
    }

    // Parse and validate resources
    const resources = z.array(resourceSchema).parse(result.toolCalls[0].args);

    logger.info('state', 'Resources extracted', {
      count: resources.length,
      types: resources.map(r => r.type)
    });

    return resources;
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Resource extraction failed');
    logger.error('api', err.message, { error: err });
    throw err;
  }
}