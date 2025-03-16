import { getVideoDetails, getPlaylistDetails } from '@/actions/getYoutubeData';
import { AnalysisClient } from './client';
import { logger } from '@/lib/ai/debug-logger';
import type { Metadata } from 'next';
import type { VideoDetails, PlaylistDetails } from '@/types/youtube';

interface PageProps {
  params: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const videoId = params['video-id'];
  if (!videoId || Array.isArray(videoId)) {
    return {
      title: 'Analysis - No Content',
      description: 'No content selected for analysis.'
    };
  }

  const data = await getVideoDetails(videoId).catch(() => null);
  if (!data) {
    return {
      title: 'Analysis - Content Not Found',
      description: 'The requested content could not be found.'
    };
  }

  return {
    title: `Analysis - ${data.title}`,
    description: data.description
  };
}

export default async function AnalysisPage({ params }: PageProps) {
  const videoId = params['video-id'];
  logger.info('state', 'Analysis page received ID', { id: videoId });

  if (!videoId || Array.isArray(videoId)) {
    return <AnalysisClient initialContent={null} initialError="No content ID provided" />;
  }

  // Try to fetch as playlist first
  logger.info('state', 'Fetching as playlist first', { id: videoId });
  const playlistData = await getPlaylistDetails(videoId).catch(() => null);
  if (playlistData) {
    // TODO: Handle playlist analysis
    return <AnalysisClient initialContent={playlistData} initialError={null} />;
  }

  // If not a playlist, try as video
  logger.info('state', 'Playlist fetch failed, trying as video', { id: videoId });
  const videoData = await getVideoDetails(videoId).catch(() => null);
  if (videoData) {
    return <AnalysisClient initialContent={videoData} initialError={null} />;
  }

  // Log error with proper error object
  const error = new Error('PLAYLIST_ID_PROVIDED');
  logger.error('state', 'Both video and playlist fetch failed', error);
  
  return <AnalysisClient initialContent={null} initialError="Content not found" />;
}
