import { NextRequest, NextResponse } from 'next/server';
import { recommendVideos } from '@/actions/recommendVideos';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, knowledgeLevel, preferredChannels, additionalContext, videoLength } = body || {};

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing required "query" string in request body' }, { status: 400 });
    }

    console.log('[video-discovery] Using internal recommendVideos action for query:', query);

    const result = await recommendVideos({
      query,
      knowledgeLevel,
      preferredChannels,
      additionalContext,
      videoLength,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Recommendation failed', recommendations: [] }, { status: 502 });
    }

    return NextResponse.json(result.recommendations || { recommendations: [] });
  } catch (err) {
    console.error('[video-discovery] Error processing request:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error', recommendations: [] }, { status: 500 });
  }
}