import { getYoutubeData } from "@/actions/getYoutubeData";
import { AnalysisClient } from "./client";
import { Metadata } from "next";

interface AnalysisPageProps {
  params: {
    "video-id": string;
  };
}

export async function generateMetadata({ params }: AnalysisPageProps): Promise<Metadata> {
  // Destructure videoId from params
  const { "video-id": videoId } = params;
  
  try {
    // Use the destructured videoId
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
  }
}

export default function AnalysisPage({ params }: AnalysisPageProps) {
  // Destructure videoId from params
  const { "video-id": videoId } = params;
  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* Pass the destructured videoId */}
      <AnalysisClient videoId={videoId} />
    </div>
  );
}
