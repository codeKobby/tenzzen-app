import { NextResponse } from 'next/server';
import { ReadableStream } from 'stream/web'; // For type hints

// This route calls the ADK service, consumes the stream, and returns the final result.
export async function POST(req: Request) {
  let videoId: string | undefined;
  let videoTitle: string | undefined;
  let videoDescription: string = '';
  let transcript: string | undefined;
  let videoDataBody: any;

  try {
    // 1. Parse request body
    try {
      const body = await req.json();
      videoId = body.videoId;
      videoTitle = body.videoTitle;
      videoDescription = body.videoDescription || '';
      transcript = body.transcript;
      videoDataBody = body.videoData;
      if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
      if (!videoDataBody) return NextResponse.json({ error: 'videoData is required' }, { status: 400 });
      if (!videoTitle) return NextResponse.json({ error: 'videoTitle is required' }, { status: 400 });
      if (!transcript) return NextResponse.json({ error: 'transcript is required' }, { status: 400 });
      console.log(`[google-ai route -> ADK] Using provided metadata and videoData for videoId: ${videoId}`);
    } catch (parseError) {
      console.error("[google-ai route -> ADK] Error parsing request body:", parseError);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // 3. Prepare payload for ADK backend using provided metadata
    const payload = {
      video_id: videoId,
      video_title: videoTitle,
      video_description: videoDescription,
      transcript: transcript,
      video_data: videoDataBody,
    };

    // 4. Call ADK backend
    console.log(`[google-ai route -> ADK] Calling ADK backend for videoId: ${videoId}`);
    // NOTE: The ADK service currently has an internal error ("unhashable type: 'Session'")
    // and this call will likely fail until that is resolved.
    const adkResponse = await fetch('http://localhost:8080/generate-course', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/x-ndjson', // ADK service streams ndjson
      },
      body: JSON.stringify(payload),
    });

    if (!adkResponse.ok) {
      const errorText = await adkResponse.text();
      console.error(`[google-ai route -> ADK] ADK backend error (${adkResponse.status}): ${errorText}`);
      return NextResponse.json({ error: `ADK backend error: ${errorText}` }, { status: 502 }); // 502 Bad Gateway
    }

    if (!adkResponse.body) {
       console.error("[google-ai route -> ADK] ADK response body is null.");
       return NextResponse.json({ error: "Received empty response from ADK service." }, { status: 502 });
    }

    // 5. Consume the ndjson stream and extract the final data
    console.log("[google-ai route -> ADK] Consuming stream from ADK service...");
    const reader = adkResponse.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalCourseData: any = null;
    let lastErrorMessage: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log("[google-ai route -> ADK] ADK Stream finished.");
        // Process any remaining buffer content
        if (buffer.trim()) {
           try {
              const update = JSON.parse(buffer.trim());
              if (update.status === 'completed' && update.data) {
                 finalCourseData = update.data;
              } else if (update.status === 'error') {
                 lastErrorMessage = update.message || 'Unknown error from final stream chunk';
              }
           } catch (e) {
              console.error("[google-ai route -> ADK] Error parsing final buffer chunk:", e, "Chunk:", buffer);
              lastErrorMessage = "Failed to parse final stream data.";
           }
        }
        break; // Exit the loop
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last potentially incomplete line

      for (const line of lines) {
        if (line.trim() === '') continue;
        try {
          const update = JSON.parse(line);
          console.log("[google-ai route -> ADK] Stream update:", update); // Log updates

          if (update.status === 'completed' && update.data) {
            finalCourseData = update.data; // Store the data from the completed message
            console.log("[google-ai route -> ADK] Final course data found in stream.");
          } else if (update.status === 'error') {
             lastErrorMessage = update.message || 'Unknown error received from stream';
             console.error("[google-ai route -> ADK] Error message received from stream:", lastErrorMessage);
          }
        } catch (e) {
          console.error("[google-ai route -> ADK] Error parsing stream line:", e, "Line:", line);
          lastErrorMessage = "Failed to parse stream update.";
        }
      }
    } // end while loop

    // 6. Return the extracted data or an error
    if (finalCourseData) {
      // --- Improved Logging ---
      console.log("[API Route] Returning final course data. Keys:", Object.keys(finalCourseData));
      console.log("[API Route] Sections received (count):", finalCourseData.sections?.length || 0);
      console.log("[API Route] Resources received (count):", finalCourseData.resources?.length || 0);
      // Log first section/resource to check structure (avoids overly long logs)
      if (finalCourseData.sections && finalCourseData.sections.length > 0) {
          console.log("[API Route] First Section Sample:", JSON.stringify(finalCourseData.sections[0], null, 2));
      }
       if (finalCourseData.resources && finalCourseData.resources.length > 0) {
          console.log("[API Route] First Resource Sample:", JSON.stringify(finalCourseData.resources[0], null, 2));
      }
      // --- End Improved Logging ---
      return NextResponse.json({ success: true, data: finalCourseData });
    } else {
      console.error("[google-ai route -> ADK] Stream finished but no final course data was extracted. Last error:", lastErrorMessage);
      // Prioritize returning the specific error message from the stream if available
      return NextResponse.json({ error: lastErrorMessage || "Failed to extract course data from ADK stream." }, { status: 502 });
    }

  } catch (error) {
    console.error("[google-ai route -> ADK Call] Outer catch block Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown server error' }, { status: 500 });
  }
}
