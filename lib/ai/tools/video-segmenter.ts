import { tool } from 'ai';
import { z } from 'zod';
import { generateContent } from '@/lib/ai/google';
import { COURSE_PROMPTS } from '@/lib/ai/prompts';
import { logger } from '@/lib/ai/debug-logger';

const segmentSchema = z.object({
  lessonId: z.string(),
  title: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  description: z.string(),
  keywords: z.array(z.string()),
  context: z.string()
});

const segmentRequestSchema = z.object({
  courseStructure: z.object({
    title: z.string(),
    sections: z.array(z.object({
      title: z.string(),
      startTime: z.number(),
      endTime: z.number(),
      lessons: z.array(z.object({
        title: z.string(),
        startTime: z.number(),
        endTime: z.number(),
        description: z.string()
      }))
    }))
  }),
  videoId: z.string()
});

interface GenerateSegmentsOptions {
  signal?: AbortSignal;
}

export const generateVideoSegments = {
  schema: segmentRequestSchema,
  execute: async (
    { params }: { params: z.infer<typeof segmentRequestSchema> },
    options: GenerateSegmentsOptions = {}
  ) => {
    try {
      const { courseStructure, videoId } = params;

      logger.info('state', 'Generating video segments', {
        course: courseStructure.title,
        videoId
      });

      // Generate initial segments
      const { result: segmentsData } = await generateContent(
        COURSE_PROMPTS.generateVideoSegments(courseStructure),
        { abortSignal: options.signal }
      );

      const parsedSegments = JSON.parse(segmentsData);
      
      // Validate and process segments
      const segments = parsedSegments.segments.map(async (segment: any) => {
        const validatedSegment = segmentSchema.parse(segment);

        // Get additional context for each segment
        const transcriptPart = `Video content from ${validatedSegment.startTime} to ${validatedSegment.endTime}`;
        const { result: enhancedData } = await generateContent(
          COURSE_PROMPTS.enhanceSegment(transcriptPart, validatedSegment.context),
          { abortSignal: options.signal }
        );

        const enhancedContent = JSON.parse(enhancedData);

        return {
          ...validatedSegment,
          enhanced: enhancedContent,
          videoId,
          embedUrl: `https://www.youtube.com/embed/${videoId}?start=${Math.floor(validatedSegment.startTime)}&end=${Math.floor(validatedSegment.endTime)}&rel=0`
        };
      });

      const processedSegments = await Promise.all(segments);

      logger.info('state', 'Video segmentation completed', {
        segments: processedSegments.length
      });

      return {
        courseTitle: courseStructure.title,
        videoId,
        segments: processedSegments
      };

    } catch (error) {
      logger.error('api', 'Video segmentation failed', error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }
};

// Export types for use in API routes
export type GenerateVideoSegmentsParams = z.infer<typeof segmentRequestSchema>;
export type { segmentSchema as SegmentSchema };