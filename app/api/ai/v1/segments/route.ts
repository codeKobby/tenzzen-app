import { NextRequest } from 'next/server';
import { COURSE_PROMPTS } from '@/lib/ai/prompts';
import { generateContent } from '@/lib/ai/google';
import { logger } from '@/lib/ai/debug-logger';
import { z } from 'zod';

// Input validation schema
const requestSchema = z.object({
  videoId: z.string(),
  section: z.object({
    title: z.string(),
    description: z.string(),
    startTime: z.number(),
    endTime: z.number(),
    transcript: z.string()
  })
});

// Response types
interface Segment {
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  content: string;
  resources: {
    title: string;
    type: string;
    url: string;
    description: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const rawBody = await request.json();
    const { videoId, section } = requestSchema.parse(rawBody);

    // Generate segment suggestions
    const { result: segmentsData } = await generateContent(
      COURSE_PROMPTS.generateVideoSegments({
        title: section.title,
        description: section.description,
        startTime: section.startTime,
        endTime: section.endTime,
        transcript: section.transcript
      })
    );

    const segments = JSON.parse(segmentsData) as Segment[];

    // Validate segments
    validateSegments(segments, section);

    logger.info('state', 'Generated video segments', {
      videoId,
      sectionTitle: section.title,
      segments: segments.length
    });

    return new Response(JSON.stringify(segments), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('api', 'Segment generation failed', error instanceof Error ? error : new Error(errorMessage));

    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: error instanceof z.ZodError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function validateSegments(segments: Segment[], section: { startTime: number; endTime: number }) {
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