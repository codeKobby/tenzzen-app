"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
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
    courseGenerating
  } = useAnalysis();

  // Use the query to check if a course exists for this video
  const existingVideo = useVideoQuery(videoData?.id || '');
  // Hook to update video with course data
  const updateVideoCourseData = useUpdateVideoCourseData();

  // Effect to ensure courseGenerating is false when courseData is available
  useEffect(() => {
    if (courseData && courseGenerating) {
      console.log("[GoogleAICourseGenerateButton] Course data available but still generating, forcing generation to complete");
      setCourseGenerating(false);
    }
  }, [courseData, courseGenerating, setCourseGenerating]);

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

  // No refs needed anymore

  const handleGenerateCourse = async () => {
    if (!videoData?.id || !videoData?.title) {
      toast.error("Missing Video Data", { description: "Please select a valid YouTube video first." });
      return;
    }

    // Start generation
    setCourseGenerating(true);
    setCourseError(null);

    try {
      // First check if we already have this course in the database
      if (existingVideo && isFullVideoDoc(existingVideo) && hasValidCourseData(existingVideo)) {
        // Use existing course data
        setCourseData(existingVideo.courseData);
        toast.success("Course loaded from database");
        return;
      }

      // Get transcript
      const transcriptSegments = await getYoutubeTranscript(videoData.id);
      const transcript = transcriptSegments.map(seg => seg.text).join(" ").trim();

      if (!transcript) {
        throw new Error("Could not retrieve transcript for this video.");
      }

      // Call the API to generate the course
      const response = await fetch('/api/course-generation/google-adk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: videoData.id,
          videoTitle: videoData.title,
          videoDescription: videoData.description || "",
          transcript,
          video_data: videoData
        })
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      // Parse the response
      const result = await response.json();

      if (!result.data) {
        throw new Error("No course data received");
      }

      // Set course data in context
      setCourseData(result.data);

      // Save to database in background
      updateVideoCourseData({
        youtubeId: videoData.id,
        courseData: result.data
      }).catch(err => console.error("Error saving to database:", err));

    } catch (error) {
      console.error("Course generation error:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to generate course";
      setCourseError(errorMsg);
      toast.error("Course Generation Failed", { description: errorMsg });
    } finally {
      // Always clean up
      setCourseGenerating(false);
    }
  };

  // We don't need a cancel function anymore

  // If we have course data, don't render anything
  if (courseData) {
    return null;
  }

  // If we're generating, don't show the button at all
  if (courseGenerating) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-4 w-full">
      <Button
        onClick={handleGenerateCourse}
        disabled={!!courseData}
        className={className}
        variant={variant}
        size={size}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
    </div>
  );
}
