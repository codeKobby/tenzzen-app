import { getVideoDetails, getPlaylistDetails } from '@/actions/getYoutubeData';
import { AnalysisClient } from './client';
import { logger } from '@/lib/ai/debug-logger';
import type { Metadata } from 'next';
import type { VideoDetails, PlaylistDetails } from '@/types/youtube';

interface StaticParams {
  'video-id': string;
}

interface PageProps {
  params: StaticParams;
  searchParams: { [key: string]: string | string[] | undefined };
}

// Helper to determine content type from ID
function determineContentType(id: string) {
  if (
    id.startsWith('PL') ||
    id.startsWith('RD') ||
    id.startsWith('UU') ||
    id.startsWith('FL') ||
    id.startsWith('LL') ||
    id.startsWith('WL') ||
    id.includes('list=')
  ) {
    return 'playlist';
  }
  return 'video';
}

export async function generateMetadata(
  { params }: PageProps,
  parent: Promise<Metadata>
): Promise<Metadata> {
  // Wait for any parent metadata
  const parentMetadata = await parent;
  
  try {
    const id = await Promise.resolve(params['video-id']);
    if (!id) {
      return {
        title: 'Analysis - No Content',
        description: 'No content selected for analysis.'
      };
    }

    // Get details based on content type
    const type = determineContentType(id);
    const fetchFn = type === 'playlist' ? getPlaylistDetails : getVideoDetails;
    const data = await fetchFn(id).catch(() => null);

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
  } catch (error) {
    return {
      title: 'Analysis - Error',
      description: 'An error occurred while loading the content.'
    };
  }
}

export default async function AnalysisPage({ params }: PageProps) {
  try {
    const id = params['video-id'];
    logger.info('state', 'Analysis page received ID', { id });

    if (!id) {
      return <AnalysisClient initialContent={null} initialError="No content ID provided" />;
    }

    // Determine content type and fetch accordingly
    const type = determineContentType(id);
    const fetchFn = type === 'playlist' ? getPlaylistDetails : getVideoDetails;
    
    logger.info('state', `Fetching as ${type}`, { id });
    const data = await fetchFn(id).catch(() => null);

    if (data) {
      return <AnalysisClient initialContent={data} initialError={null} />;
    }

    // Log error if fetch failed
    const error = new Error(`${type} content not found`);
    logger.error('state', `${type} fetch failed`, error);
    
    return <AnalysisClient 
      initialContent={null} 
      initialError={`Could not load ${type} content`} 
    />;
  } catch (error) {
    logger.error('state', 'Analysis page error', error);
    return <AnalysisClient initialContent={null} initialError="An unexpected error occurred" />;
  }
}
