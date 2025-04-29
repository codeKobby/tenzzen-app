"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "./custom-toast";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript";
import { useVideoQuery, useUpdateVideoCourseData } from "@/hooks/use-convex"; // Import the new hook

interface GoogleAICourseGenerateButtonProps {
  className?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  buttonText?: string; // Added optional buttonText prop
}

export function GoogleAICourseGenerateButton({
  className = "",
  size = "lg",
  variant = "default",
  buttonText = "Generate Course" // Default text
}: GoogleAICourseGenerateButtonProps) {
  const {
    videoData,
    setCourseData,
    courseData,
    setCourseError,
    courseError,
    setCourseGenerating,
    courseGenerating,
    setProgressMessage,
    setGenerationProgress,
  } = useAnalysis();

  // Use the query to check if a course exists for this video
  const existingVideo = useVideoQuery(videoData?.id || '');
  // Hook to update video with course data
  const updateVideoCourseData = useUpdateVideoCourseData();
  const [isChecking, setIsChecking] = useState(false);
  const [isSavingToDb, setIsSavingToDb] = useState(false);

  // Type guard for expired video objects
  function isExpiredVideo(video: any): video is { _id: string; expired: true } {
    return video && 'expired' in video && video.expired === true;
  }

  // Type guard for full video documents with details
  function isFullVideoDoc(video: any): video is { details: any; _id: string; _creationTime: number; courseData?: any } {
    return video && 'details' in video;
  }

  // Helper function to check if a video object has valid course data
  function hasValidCourseData(video: any): boolean {
    return video && 'courseData' in video && !!video.courseData;
  }

  const handleGenerateCourse = async () => {
    if (!videoData?.id || !videoData?.title) {
      toast.error("Missing Video Data", { description: "Please select a valid YouTube video first." });
      return;
    }

    // Start progress for checking database
    setIsChecking(true);
    setCourseGenerating(true);
    setCourseError(null);
    setProgressMessage("Checking database for existing course...");
    setGenerationProgress(5);

    try {
      // First check if we already have this course in the database
      if (existingVideo) {
        // Check if the video is expired using our type guard
        const isExpired = isExpiredVideo(existingVideo);

        // If not expired and has valid course data, use it directly
        if (!isExpired && isFullVideoDoc(existingVideo) && hasValidCourseData(existingVideo)) {
          setProgressMessage("Found existing course in database...");
          setGenerationProgress(100);

          // Use the existing course data
          console.log("Using existing course data from database:", existingVideo.courseData);
          setCourseData(existingVideo.courseData);
          toast.success("Course loaded from database.");
          setCourseGenerating(false);
          setIsChecking(false);
          return; // Exit early as we already have the course
        }
      }

      // If we reach here, either no course exists or it's expired
      // Continue with normal generation process
      setIsChecking(false);
      setProgressMessage("Fetching transcript...");
      setGenerationProgress(10);

      const transcriptSegments = await getYoutubeTranscript(videoData.id);
      const transcript = transcriptSegments.map(seg => seg.text).join(" ").trim();

      if (!transcript) {
        throw new Error("Could not retrieve transcript for this video.");
      }

      setProgressMessage("Generating course with Google AI ADK...");
      setGenerationProgress(20);

      // Call the ADK endpoint for direct JSON response
      const response = await fetch('/api/course-generation/google-adk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Changed to accept JSON
        },
        body: JSON.stringify({
          videoId: videoData.id,
          videoTitle: videoData.title,
          videoDescription: videoData.description || "",
          transcript,
          video_data: videoData
        }),
      });

      if (!response.ok) {
        let errorMsg = `Error: ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData.error || errData.message || errorMsg;
        } catch { }
        throw new Error(errorMsg);
      }

      // Parse the direct JSON response
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.data) {
        throw new Error("No course data received from the API");
      }

      // Show progress at 90% for course generation completion
      setProgressMessage("Course generated successfully! Saving to database...");
      setGenerationProgress(90);
      setIsSavingToDb(true);

      // Add the videoId to the course data if it's missing
      const finalData = result.data;
      if (!finalData.videoId && videoData.id) {
        finalData.videoId = videoData.id;
      }

      // Save the course data to the database
      try {
        await updateVideoCourseData({
          youtubeId: videoData.id,
          courseData: finalData
        });
        console.log("Course data saved to database");
        setProgressMessage("Course saved to database!");
        setGenerationProgress(100);
      } catch (dbError) {
        console.error("Error saving course to database:", dbError);
        // Continue anyway since we have the data in memory
        setProgressMessage("Note: Course not saved to database, but available for current session");
      }

      setCourseData(finalData);
      toast.success("Course generated successfully!");
      setCourseGenerating(false);
      setIsSavingToDb(false);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to generate course";
      setCourseError(errorMsg);
      setProgressMessage("Course generation failed");
      setGenerationProgress(0);
      toast.error("Generation Failed", { description: errorMsg });
      setCourseGenerating(false);
      setIsChecking(false);
      setIsSavingToDb(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateCourse}
      disabled={courseGenerating}
      className={className}
      variant={variant}
      size={size}
    >
      {courseGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {isChecking ? "Checking database..." :
            isSavingToDb ? "Saving to database..." : "Generating..."}
        </>
      ) : (
        <> <Sparkles className="mr-2 h-4 w-4" /> {buttonText} </>
      )}
    </Button>
  );
}
