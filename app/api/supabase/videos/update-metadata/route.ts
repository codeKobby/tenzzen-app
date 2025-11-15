import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { createLogger } from '@/lib/debug-logger';
import { formatDuration, parseDurationToSeconds } from '@/lib/utils/format';
import { getFetchOptions } from '@/lib/utils/youtube-server';
import { config } from '@/lib/config';

const logger = createLogger('update-video-metadata');

/**
 * API endpoint to update video metadata for all videos in the database
 * GET /api/supabase/videos/update-metadata
 */
export async function GET(req: NextRequest) {
  try {
    // Create a Supabase client
    const supabase = createAdminSupabaseClient();
    
    // Get all videos from the database
    const { data: videos, error } = await supabase
      .from('videos')
      .select('*');
      
    if (error) {
      logger.error('Error fetching videos:', error);
      return NextResponse.json({
        error: 'Failed to fetch videos',
        details: error
      }, { status: 500 });
    }
    
    if (!videos || videos.length === 0) {
      return NextResponse.json({
        message: 'No videos found to update'
      });
    }
    
    logger.log(`Found ${videos.length} videos to update`);
    
    // Process videos in batches to avoid rate limiting
    const batchSize = 5;
    const results = {
      total: videos.length,
      updated: 0,
      failed: 0,
      details: [] as any[]
    };
    
    // Process videos in batches
    for (let i = 0; i < videos.length; i += batchSize) {
      const batch = videos.slice(i, i + batchSize);
      
      // Process each video in the batch
      const batchPromises = batch.map(async (video) => {
        try {
          // Skip videos that already have channel_avatar and duration_raw
          if (video.channel_avatar && video.duration_raw) {
            logger.log(`Video ${video.video_id} already has complete metadata`);
            return {
              video_id: video.video_id,
              status: 'skipped',
              reason: 'Already has complete metadata'
            };
          }
          
          // Fetch video data from YouTube API
          const apiResponse = await fetch(
            `${config.youtube.apiUrl}/videos?part=snippet,contentDetails,statistics&id=${video.video_id}&key=${config.youtube.apiKey}`,
            await getFetchOptions()
          );
          
          if (!apiResponse.ok) {
            throw new Error(`YouTube API error: ${apiResponse.status}`);
          }
          
          const data = await apiResponse.json();
          if (!data.items?.[0]) {
            throw new Error('Video not found');
          }
          
          const ytVideo = data.items[0];
          
          // Get channel avatar
          let channelAvatar = '';
          try {
            const channelId = ytVideo.snippet?.channelId;
            if (channelId) {
              const channelResponse = await fetch(
                `${config.youtube.apiUrl}/channels?part=snippet&id=${channelId}&key=${config.youtube.apiKey}`,
                await getFetchOptions()
              );
              
              if (channelResponse.ok) {
                const channelData = await channelResponse.json();
                channelAvatar = channelData.items?.[0]?.snippet?.thumbnails?.default?.url || '';
              }
            }
          } catch (avatarError) {
            logger.warn(`Error fetching channel avatar for video ${video.video_id}:`, avatarError);
          }
          
          // Get duration
          const rawDuration = ytVideo.contentDetails?.duration || '';
          const durationInSeconds = parseDurationToSeconds(rawDuration);
          
          // Update video in database
          const { error: updateError } = await supabase
            .from('videos')
            .update({
              channel_avatar: channelAvatar,
              duration_raw: rawDuration,
              duration: durationInSeconds,
              updated_at: new Date().toISOString()
            })
            .eq('id', video.id);
            
          if (updateError) {
            throw updateError;
          }
          
          results.updated++;
          return {
            video_id: video.video_id,
            status: 'updated',
            channel_avatar: !!channelAvatar,
            duration_raw: !!rawDuration
          };
        } catch (error) {
          logger.error(`Error updating video ${video.video_id}:`, error);
          results.failed++;
          return {
            video_id: video.video_id,
            status: 'failed',
            error: error instanceof Error ? error.message : String(error)
          };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.details.push(...batchResults);
      
      // Add a delay between batches to avoid rate limiting
      if (i + batchSize < videos.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    logger.error('Error updating video metadata:', error);
    return NextResponse.json({
      error: 'Failed to update video metadata',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
