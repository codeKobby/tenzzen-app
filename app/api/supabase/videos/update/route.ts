import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint to update video course data in Supabase
 * POST /api/supabase/videos/update
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { youtubeId, courseData } = body;

    // Validate input
    if (!youtubeId || !courseData) {
      return NextResponse.json({
        error: 'Missing required data'
      }, { status: 400 });
    }

    // Log the video data for debugging
    console.log('Updating video in Supabase:', {
      youtubeId,
      title: courseData.title || '',
      hasData: !!courseData
    });

    // Create a Supabase client with the service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Check if the video exists
    const { data: existingVideo, error: queryError } = await supabase
      .from('videos')
      .select('id')
      .eq('video_id', youtubeId)
      .single();

    if (queryError && queryError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking if video exists:', queryError);
      return NextResponse.json({
        error: 'Error checking if video exists',
        details: queryError
      }, { status: 500 });
    }

    const videoRecord = {
      video_id: youtubeId,
      title: courseData.title || '',
      description: courseData.description || '',
      thumbnail: courseData.image || '',
      course_data: courseData,
      cached_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let result;

    if (existingVideo) {
      // Update existing video
      console.log('Updating existing video:', existingVideo.id);
      const { data, error: updateError } = await supabase
        .from('videos')
        .update(videoRecord)
        .eq('id', existingVideo.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating video:', updateError);
        return NextResponse.json({
          error: 'Error updating video',
          details: updateError
        }, { status: 500 });
      }

      result = data;
    } else {
      // Insert new video
      console.log('Inserting new video');
      const { data, error: insertError } = await supabase
        .from('videos')
        .insert({
          ...videoRecord,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting video:', insertError);
        return NextResponse.json({
          error: 'Error inserting video',
          details: insertError
        }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      message: existingVideo ? 'Video updated successfully' : 'Video created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error updating video in Supabase:', error);
    return NextResponse.json({
      error: 'Failed to update video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
