import { NextResponse } from 'next/server';
import { ReadableStream } from 'stream/web'; // Use Node.js stream

// This route calls the ADK service and streams its response
export async function POST(req: Request) {
  let videoId: string | undefined;
  let difficulty: string = 'Intermediate';

  try {
    // 1. Parse request body: expect videoId, videoTitle, transcript, optional difficulty
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("[google-adk route] Error parsing request body:", parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    videoId = body.videoId;
    const videoTitle: string | undefined = body.videoTitle;
    const videoDescription: string = body.videoDescription || '';
    const transcript: string | undefined = body.transcript;
    difficulty = body.difficulty || difficulty;
    if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    if (!videoTitle) return NextResponse.json({ error: 'videoTitle is required' }, { status: 400 });
    if (!transcript) return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
    console.log(`[google-adk route] Using provided metadata/transcript for videoId: ${videoId}`);

    // 2. Prepare payload for ADK backend using provided data
    const payload = {
      video_id: videoId,
      video_title: videoTitle,
      video_description: videoDescription,
      transcript: transcript,
      difficulty,
    };

    // 4. Call ADK backend and stream the response
    console.log(`[google-adk route] Calling ADK backend for videoId: ${videoId}`);
    const adkResponse = await fetch('http://localhost:8080/generate-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/x-ndjson', // Expecting newline-delimited JSON stream
      },
      body: JSON.stringify(payload),
    });

    if (!adkResponse.ok) {
      const errorText = await adkResponse.text();
      console.error(`[google-adk route] ADK backend error (${adkResponse.status}): ${errorText}`);
      return new Response(JSON.stringify({ error: `ADK backend error: ${errorText}` }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!adkResponse.body) {
      console.error("[google-adk route] ADK response body is null.");
      return new Response(JSON.stringify({ error: "Received empty response from ADK service." }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 5. Stream the response back to the client
    const headers = new Headers({
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    const responseStream = adkResponse.body as ReadableStream<Uint8Array>;
    console.log("[google-adk route] Streaming response from ADK service to client.");
    return new Response(responseStream as any, { headers });

  } catch (error) {
    console.error("[google-adk route] Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
