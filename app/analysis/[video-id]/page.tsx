import { getVideoDetails, getPlaylistDetails } from "@/app/actions/youtube"
import { AnalysisClient } from "./client"
import { formatErrorMessage } from "@/lib/utils"

interface Props {
  params: { 'video-id': string }
}

// This renders on the server
export default async function AnalysisPage({ params }: Props) {
  // Get video ID from params
  const videoId = params['video-id'];

  if (!videoId) {
    return <AnalysisClient initialContent={null} initialError="No content ID provided" />;
  }

  try {
    // Try video first
    const videoRes = await getVideoDetails(videoId);
    return <AnalysisClient initialContent={videoRes} initialError={null} />;
  } catch (videoError) {
    try {
      // If video fails, try playlist
      const playlistRes = await getPlaylistDetails(videoId);
      return <AnalysisClient initialContent={playlistRes} initialError={null} />;
    } catch (playlistError) {
      // Format error for display
      const errorMessage = formatErrorMessage(videoError) || formatErrorMessage(playlistError);
      return <AnalysisClient initialContent={null} initialError={errorMessage} />;
    }
  }
}
