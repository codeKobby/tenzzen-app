import { NextResponse } from 'next/server';
import { createErrorResponse, createSuccessResponse, inputSchema } from '@/lib/ai/types/api';
import { handleSectionContent } from '@/lib/ai/handlers/generate';
import { z } from 'zod';
import { generateContent } from '@/lib/ai/google';

export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes max duration for streaming

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const input = inputSchema.parse(body);

    if (input.type === 'segment') {
      try {
        const { section } = input.data;
        const segments = await handleSectionContent(section);
        return NextResponse.json(createSuccessResponse(segments));
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Segment generation failed');
      }
    }

    // Extract content for generation
    const content = input.type === 'video'
      ? `Title: ${input.data.title}\nDuration: ${input.data.duration || 'N/A'}\nDescription: ${input.data.description}`
      : `Playlist: ${input.data.title}\nVideos: ${input.data.videos.length}\nDescription: ${input.data.description}`;

    try {
      // Generate content with streaming
      const response = await generateContent(content, { stream: true });

      // Return streaming response or success response based on response type
      if (response instanceof Response) {
        return response;
      } else {
        return NextResponse.json(createSuccessResponse({ content: response }));
      }
    } catch (error) {
      console.error('Generation error:', error);
      throw error;
    }
  } catch (error) {
    console.error('[AI API] Error:', error);
    
    // Return appropriate error response
    return NextResponse.json(
      createErrorResponse(error),
      { status: error instanceof z.ZodError ? 400 : 500 }
    );
  }
}
