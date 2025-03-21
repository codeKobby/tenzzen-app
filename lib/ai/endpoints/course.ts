import { generateContent, courseGenerationTools } from '@/lib/ai/google';
import { COURSE_PROMPTS } from '@/lib/ai/prompts';
import { logger } from '@/lib/ai/debug-logger';
import { Segment, getResultText } from '@/lib/ai/types';
import { z } from 'zod';

// Input validation schemas
export const courseInputSchema = z.object({
  type: z.literal('course'),
  data: z.object({
    type: z.enum(['video', 'playlist']),
    details: z.object({
      title: z.string(),
      duration: z.string().optional(),
      description: z.string(),
      videos: z.array(z.object({
        title: z.string(),
        duration: z.string(),
        description: z.string()
      })).optional()
    })
  })
});

export type CourseInput = z.infer<typeof courseInputSchema>;

export type SegmentInput = {
  type: 'segment';
  data: {
    videoId: string;
    section: {
      title: string;
      description: string;
      startTime: number;
      endTime: number;
      transcript: string;
    };
  };
};

export const segmentInputSchema: z.ZodType<SegmentInput> = z.object({
  type: z.literal('segment'),
  data: z.object({
    videoId: z.string(),
    section: z.object({
      title: z.string(),
      description: z.string(),
      startTime: z.number(),
      endTime: z.number(),
      transcript: z.string()
    })
  })
});

export type Input = CourseInput | SegmentInput;
export const inputSchema: z.ZodType<Input> = z.discriminatedUnion('type', [
  courseInputSchema,
  segmentInputSchema
]);

export function validateSegments(segments: Segment[], section: { startTime: number; endTime: number }): boolean {
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('No segments generated');
  }

  let previousEndTime = section.startTime;

  segments.forEach((segment, index) => {
    if (!segment.title) {
      throw new Error(`Segment ${index + 1} title is missing`);
    }

    if (typeof segment.startTime !== 'number' || typeof segment.endTime !== 'number') {
      throw new Error(`Segment ${index + 1} timestamps are invalid`);
    }

    if (segment.startTime < previousEndTime) {
      throw new Error(`Segment ${index + 1} has overlapping timestamps`);
    }

    if (segment.startTime < section.startTime || segment.endTime > section.endTime) {
      throw new Error(`Segment ${index + 1} timestamps are outside section bounds`);
    }

    previousEndTime = segment.endTime;
  });

  return true;
}

export async function handleCourseGeneration(
  encoder: TextEncoder,
  input: CourseInput['data']
) {
  const stream = new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }
  });

  const writer = stream.writable.getWriter();

  try {
    // Send initial progress
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'progress', progress: 0 })}\n\n`
    ));

    // Generate course content
    const result = await generateContent(
      input.details.description,
      {
        tools: courseGenerationTools,
        toolChoice: {
          type: 'tool',
          toolName: 'generateCourseStructure'
        }
      }
    );

    // Send progress update
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'progress', progress: 50 })}\n\n`
    ));

    const resultText = getResultText(result);
    
    // Send generated content
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({
        type: 'tool-result',
        toolName: 'generateCourse',
        result: resultText
      })}\n\n`
    ));

    // Send completion
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'progress', progress: 100 })}\n\n`
    ));

    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'finish' })}\n\n`
    ));

  } catch (error) {
    // Send error in stream
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : 'Generation failed'
      })}\n\n`
    ));
    throw error;
  } finally {
    await writer.close();
  }

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}

export async function handleSegmentGeneration(
  input: SegmentInput['data']
) {
  const { videoId, section } = input;

  // Generate segments
  const result = await generateContent(
    COURSE_PROMPTS.generateVideoSegments({
      title: section.title,
      description: section.description,
      startTime: section.startTime,
      endTime: section.endTime,
      transcript: section.transcript
    })
  );

  const resultText = getResultText(result);
  const segments = JSON.parse(resultText) as Segment[];

  validateSegments(segments, section);

  logger.info('state', 'Generated video segments', {
    videoId,
    sectionTitle: section.title,
    segments: segments.length
  });

  return segments;
}