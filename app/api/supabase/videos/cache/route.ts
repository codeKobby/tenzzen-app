import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { createLogger } from '@/lib/debug-logger';

const logger = createLogger('videos-cache');

/**
 * API endpoint to cache YouTube video data in Supabase
 * POST /api/supabase/videos/cache
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const body = await req.json();
    const { youtubeId, details, cachedAt, transcript } = body;

    // Validate input
    if (!youtubeId || !details || !details.title) {
      return NextResponse.json({
        error: 'Missing required video data'
      }, { status: 400 });
    }

    // Log the video data for debugging
    logger.log('Caching video to Supabase:', {
      youtubeId,
      title: details.title,
      hasTranscript: !!transcript
    });

    // Create a Supabase client - try both admin and regular client
    let supabase;
    try {
      // First try with the server client (with auth)
      supabase = await createServerSupabaseClient();
      logger.log('Using authenticated Supabase client');
    } catch (authError) {
      logger.error('Error creating authenticated Supabase client:', authError);
      // Fall back to admin client if auth fails
      supabase = createAdminSupabaseClient();
      logger.log('Falling back to admin Supabase client');
    }

    // Check if a video with this ID already exists
    const { data: existingVideos, error: queryError } = await supabase
      .from('videos')
      .select('id')
      .eq('video_id', youtubeId)
      .limit(1);

    if (queryError) {
      logger.error('Error checking for existing video:', queryError);
      return NextResponse.json({
        error: 'Failed to check for existing video',
        details: queryError
      }, { status: 500 });
    }

    // Prepare video data for insertion/update
    const videoRecord = {
      video_id: youtubeId,
      title: details.title,
      description: details.description || '',
      thumbnail: details.thumbnail || '',
      duration: details.duration ? parseInt(details.duration) || 0 : 0,
      channel_id: details.channelId || '',
      channel_title: details.channelName || '',
      published_at: details.publishDate ? new Date(details.publishDate).toISOString() : null,
      view_count: details.views ? parseInt(details.views.replace(/,/g, '')) || 0 : 0,
      like_count: details.likes ? parseInt(details.likes.replace(/,/g, '')) || 0 : 0,
      comment_count: details.commentCount ? parseInt(details.commentCount.replace(/,/g, '')) || 0 : 0,
      tags: details.tags || [],
      course_data: null,
      transcript: transcript || null,
      cached_at: cachedAt || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    let videoId;

    // Insert or update the video
    try {
      if (existingVideos && existingVideos.length > 0) {
        // Update existing video
        logger.log('Updating existing video:', existingVideos[0].id);
        const { data: updatedVideo, error: updateError } = await supabase
          .from('videos')
          .update(videoRecord)
          .eq('id', existingVideos[0].id)
          .select('id')
          .single();

        if (updateError) {
          logger.error('Error updating video:', updateError);
          return NextResponse.json({
            error: 'Failed to update video',
            details: updateError
          }, { status: 500 });
        }

        videoId = existingVideos[0].id;
      } else {
        // Insert new video
        logger.log('Inserting new video');
        const { data: newVideo, error: insertError } = await supabase
          .from('videos')
          .insert(videoRecord)
          .select('id')
          .single();

        if (insertError) {
          logger.error('Error inserting video:', insertError);
          return NextResponse.json({
            error: 'Failed to insert video',
            details: insertError
          }, { status: 500 });
        }

        videoId = newVideo.id;
      }
    } catch (dbError) {
      logger.error('Database operation failed:', dbError);
      return NextResponse.json({
        error: 'Database operation failed',
        details: dbError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Video cached successfully',
      videoId
    });
  } catch (error) {
    logger.error('Error caching video to Supabase:', error);
    return NextResponse.json({
      error: 'Failed to cache video',
      details: error
    }, { status: 500 });
  }
}

/**
 * API endpoint to get a cached video from Supabase
 * GET /api/supabase/videos/cache?youtubeId=VIDEO_ID
 */
export async function GET(req: NextRequest) {
  try {
    // Get the YouTube ID from the query parameters
    const url = new URL(req.url);
    const youtubeId = url.searchParams.get('youtubeId');

    if (!youtubeId) {
      return NextResponse.json({
        error: 'Missing YouTube ID'
      }, { status: 400 });
    }

    // Create a Supabase client
    const supabase = createAdminSupabaseClient();

    // Get the video from the database
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('video_id', youtubeId)
      .single();

    if (error) {
      logger.error('Error getting video from Supabase:', error);
      return NextResponse.json({
        error: 'Failed to get video',
        details: error
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({
        error: 'Video not found'
      }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error getting video from Supabase:', error);
    return NextResponse.json({
      error: 'Failed to get video',
      details: error
    }, { status: 500 });
  }
}
