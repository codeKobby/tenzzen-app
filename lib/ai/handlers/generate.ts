import { type GenerativeModel } from '@google/generative-ai';
import { generateContent } from '@/lib/ai/google';
import { COURSE_PROMPTS, getPromptForType } from '@/lib/ai/prompts';
import { logger } from '@/lib/ai/debug-logger';
import { StreamMessage, StreamHandler } from '@/lib/api/stream';
import { AIInput, VideoSection } from '@/lib/ai/types/api';
import { courseStructureSchema } from '@/tools/schema';
import { getModel } from '@/lib/ai/config';
import { createStreamFromAsyncGenerator } from '@/lib/utils/stream';

type GoogleMessageContent = {
  role: 'user' | 'assistant' | 'system';
  parts: Array<{ text: string }>;
};

type StreamingResponse = {
  stream: AsyncIterable<string> | AsyncIterable<{ text: string }>;
};

type CompletionResponse = {
  result: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
};

export async function handleVideoContent(
  input: AIInput,
  stream: TransformStream<StreamMessage>,
  encoder: TextEncoder
) {
  const handler = new StreamHandler(stream.writable, encoder);

  try {
    await handler.progress(0);

    if (input.type === 'segment') {
      throw new Error('Segment input not supported for course generation');
    }

    const data = input.type === 'video' 
      ? {
          title: input.data.title,
          description: input.data.description,
          duration: input.data.duration
        }
      : {
          title: input.data.title,
          description: input.data.description,
          videos: input.data.videos
        };

    const { systemPrompt, examples } = getPromptForType(
      input.type,
      JSON.stringify(data, null, 2)
    );

    // Combine prompts into single prompt
    const fullPrompt = [
      systemPrompt,
      examples,
      `Input data: ${JSON.stringify(data, null, 2)}`,
      'Generate a complete course structure in JSON format'
    ].filter(Boolean).join('\n\n');

    const response = await generateContent(fullPrompt, {
      stream: true,
      tools: {
        generateCourseStructure: {
          description: "Generate a structured course outline from content",
          parameters: courseStructureSchema
        }
      },
      toolChoice: 'required'
    });

    let accumulatedCompletion = '';

    // Create async generator to handle streaming
    async function* streamGenerator() {
      try {
        // Handle streaming response
        if (typeof response === 'object' && 'stream' in response) {
          yield { type: 'progress', progress: 10 } as StreamMessage;

          const streamResponse = response as StreamingResponse;
          for await (const chunk of streamResponse.stream) {
            const text = typeof chunk === 'string' ? chunk : chunk.text;
            if (text) {
              accumulatedCompletion += text;
              yield {
                type: 'tool-result',
                toolName: 'streamText',
                result: text
              } as StreamMessage;
            }
          }
        }
        // Handle non-streaming response
        else if (typeof response === 'object' && 'result' in response) {
          const completionResponse = response as CompletionResponse;
          accumulatedCompletion = completionResponse.result;
          yield {
            type: 'tool-result',
            toolName: 'streamText',
            result: completionResponse.result
          } as StreamMessage;
        }

        // After content is collected, validate and send final result
        if (accumulatedCompletion) {
          try {
            const validatedCourse = courseStructureSchema.parse(JSON.parse(accumulatedCompletion));
            yield {
              type: 'tool-result',
              toolName: 'generateCourse',
              result: JSON.stringify(validatedCourse)
            } as StreamMessage;
            yield { type: 'progress', progress: 100 } as StreamMessage;
            yield { type: 'finish' } as StreamMessage;
          } catch (error) {
            console.error('Stream completion error:', error);
            yield {
              type: 'error',
              error: 'Failed to validate course structure'
            } as StreamMessage;
          }
        }
      } catch (error) {
        yield {
          type: 'error',
          error: error instanceof Error ? error.message : 'Stream processing failed'
        } as StreamMessage;
      }
    }

    // Create readable stream from generator and pipe it to the output
    const readableStream = createStreamFromAsyncGenerator(streamGenerator());
    await readableStream.pipeTo(stream.writable);

    return response;

  } catch (error) {
    logger.error('api', 'Course generation failed', error);
    await handler.error(error instanceof Error ? error.message : 'Generation failed');
    throw error;
  } finally {
    await handler.close();
  }
}

export async function handleSectionContent(section: VideoSection) {
  const prompt = COURSE_PROMPTS.generateVideoSegments({
    title: section.title,
    description: section.description,
    startTime: section.startTime,
    endTime: section.endTime,
    transcript: section.transcript
  });

  const response = await generateContent(prompt) as CompletionResponse;

  const segments = JSON.parse(response.result);
  
  if (!segments?.length) {
    throw new Error('Failed to generate segments');
  }

  logger.info('state', 'Generated video segments', {
    sectionTitle: section.title,
    segments: segments.length
  });

  return segments;
}
