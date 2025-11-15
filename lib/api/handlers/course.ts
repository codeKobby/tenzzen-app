import { generateContent, courseGenerationTools } from '@/lib/ai/google';
import { COURSE_PROMPTS } from '@/lib/ai/prompts';
import { logger } from '@/lib/ai/debug-logger';
import { StreamEvent } from '@/lib/ai/types/stream';

export async function generateCourseContent(description: string, encoder: TextEncoder) {
  const stream = new TransformStream({
    transform(chunk: StreamEvent, controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
    }
  });

  const writer = stream.writable.getWriter();

  try {
    // Initial progress
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'progress', progress: 0 })}\n\n`
    ));

    // Generate content
    const result = await generateContent(description, {
      tools: courseGenerationTools,
      toolChoice: { type: 'tool', toolName: 'generateCourseStructure' }
    });

    // Mid progress
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'progress', progress: 50 })}\n\n`
    ));

    const text = 'text' in result ? result.text : result.result;
    
    // Send result
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({
        type: 'tool-result',
        toolName: 'generateCourse',
        result: text
      })}\n\n`
    ));

    // Final progress and completion
    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'progress', progress: 100 })}\n\n`
    ));

    await writer.write(encoder.encode(
      `data: ${JSON.stringify({ type: 'finish' })}\n\n`
    ));

  } catch (error) {
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

export async function generateSegmentContent(section: {
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  transcript: string;
}) {
  const result = await generateContent(
    COURSE_PROMPTS.generateVideoSegments(section)
  );

  const text = 'text' in result ? result.text : result.result;
  const segments = JSON.parse(text);

  logger.info('state', 'Generated video segments', {
    sectionTitle: section.title,
    segments: segments.length
  });

  return segments;
}