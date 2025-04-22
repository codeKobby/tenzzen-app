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
