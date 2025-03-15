import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getYoutubeData } from '@/actions/getYoutubeData';
import { getYoutubeTranscript } from '@/actions/getYoutubeTranscript';
import { COURSE_PROMPTS } from '@/lib/ai/prompts';
import { generateContent } from '@/lib/ai/google';
import { logger } from '@/lib/ai/debug-logger';
import { parseDuration } from '@/lib/youtube';

// Input validation
const requestSchema = z.object({
  videoId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request
    const rawBody = await request.json();
    const { videoId } = requestSchema.parse(rawBody);

    // Fetch video data and transcript in parallel
    const [videoDataResult, transcript] = await Promise.all([
      getYoutubeData(videoId),
      getYoutubeTranscript(videoId)
    ]);

    if (!videoDataResult.success) {
      throw new Error(videoDataResult.error);
    }

    if (!transcript) {
      throw new Error('No transcript available for this video');
    }

    const videoData = videoDataResult.data;

    // Generate course structure
    const { result: courseData } = await generateContent(
      COURSE_PROMPTS.generateStructure(transcript)
    );

    const course = JSON.parse(courseData);

    // Add video metadata
    course.title = course.title || videoData.title;
    course.overview.totalDuration = parseDuration(videoData.duration);

    // Log success
    logger.info('state', 'Generated course structure', {
      videoId,
      title: course.title,
      sections: course.sections.length,
      totalLessons: course.sections.reduce((acc, s) => acc + s.lessons.length, 0)
    });

    // Return course data
    return new Response(JSON.stringify(course), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    // Handle errors
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    logger.error('api', 'Course generation failed', error instanceof Error ? error : new Error(errorMessage));

    return new Response(
      JSON.stringify({ error: errorMessage }), 
      {
        status: error instanceof z.ZodError ? 400 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}