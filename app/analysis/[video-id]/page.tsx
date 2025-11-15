<<<<<<< HEAD
import { getYoutubeData } from "@/actions/getYoutubeData";
import { AnalysisClient } from "./client";
import { Metadata } from "next";

interface AnalysisPageProps {
  params: {
    "video-id": string;
  };
}

export async function generateMetadata({ params }: AnalysisPageProps): Promise<Metadata> {
  // Access videoId directly
  const videoId = params["video-id"];
  
  try {
    // Use the videoId
    const videoData = await getYoutubeData(videoId);
    
    return {
      title: `${videoData.title} - TenzZen`,
      description: `Analyze and generate a course from ${videoData.title}`,
    };
  } catch (error) {
    return {
      title: "Video Analysis - TenzZen",
      description: "Analyze and generate a course from YouTube content",
    };
=======
import { getVideoDetails, getPlaylistDetails } from "@/actions/getYoutubeData"
import { AnalysisClient } from "./client"
import { formatErrorMessage } from "@/lib/utils"

interface Props {
  params: Promise<{ 'video-id': string }> | { 'video-id': string }
}

// Helper function to identify the likely ID type
function guessIdType(id: string): 'video' | 'playlist' | 'unknown' {
  // Video IDs are typically 11 characters
  if (/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return 'video';
  }

  // Playlist IDs often start with PL, FL, UU, etc.
  if (/^(PL|FL|UU|LL|RD|OL|TL|ULAK5uy_)[A-Za-z0-9_-]{10,}$/.test(id)) {
    return 'playlist';
  }

  // If it's longer than 11 chars but doesn't match playlist patterns, guess playlist
  if (id.length > 11) {
    return 'playlist';
  }

  return 'unknown';
}

// This renders on the server
export default async function AnalysisPage(props: Props) {
  const params = await props.params;
  // Ensure params are properly handled as they might be a promise
  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams['video-id'];

  if (!id) {
    return <AnalysisClient initialContent={null} initialError="No content ID provided" />;
  }

  console.log(`Analysis page received ID: ${id}`);

  // Try to guess if this is a video or playlist ID
  const idType = guessIdType(id);

  try {
    // Try the best guess first
    if (idType === 'playlist') {
      console.log(`Fetching as playlist first: ${id}`);
      try {
        const playlistRes = await getPlaylistDetails(id, true);
        return <AnalysisClient initialContent={playlistRes} initialError={null} />;
      } catch (playlistError) {
        console.log(`Playlist fetch failed, trying as video: ${id}`);
        // If playlist fails, fall back to video
        const videoRes = await getVideoDetails(id);
        return <AnalysisClient initialContent={videoRes} initialError={null} />;
      }
    } else {
      console.log(`Fetching as video first: ${id}`);
      try {
        const videoRes = await getVideoDetails(id);
        return <AnalysisClient initialContent={videoRes} initialError={null} />;
      } catch (videoError) {
        console.log(`Video fetch failed, trying as playlist: ${id}`);
        // If video fails, try playlist
        const playlistRes = await getPlaylistDetails(id, true);
        return <AnalysisClient initialContent={playlistRes} initialError={null} />;
      }
    }
  } catch (error) {
    // Both attempts failed
    const errorMessage = formatErrorMessage(error);
    console.error(`Both video and playlist fetch failed: ${errorMessage}`);
    return <AnalysisClient initialContent={null} initialError={errorMessage} />;
>>>>>>> master
  }
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  // Access videoId directly
  const videoId = params["video-id"];
  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Pass the videoId */}
      <AnalysisClient videoId={videoId} />
    </div>
  );
}
