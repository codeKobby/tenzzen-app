"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "./custom-toast";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript";
import { useSupabaseVideoQuery, useUpdateSupabaseVideoCourseData, useSaveSupabaseCourseToPublic } from "@/hooks/use-supabase-courses";

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

  // Reference to the abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Use the query to check if a course exists for this video
  const { data: existingVideo } = useSupabaseVideoQuery(videoData?.id || '');
  // Hook to update video with course data
  const { updateVideoCourseData } = useUpdateSupabaseVideoCourseData();
  // Hook to save course to public database
  const { saveGeneratedCourseToPublic } = useSaveSupabaseCourseToPublic();

  // Effect to ensure courseGenerating is false when courseData is available
  useEffect(() => {
    if (courseData && courseGenerating) {
      console.log("[GoogleAICourseGenerateButton] Course data available but still generating, forcing generation to complete");
      // Use setTimeout to avoid state updates during render phase
      setTimeout(() => {
        setCourseGenerating(false);
      }, 0);
    }
  }, [courseData, courseGenerating, setCourseGenerating]);

  // Type guard for expired video objects
  function isExpiredVideo(video: any): video is { id: string; expired: true } {
    return video && 'expired' in video && video.expired === true;
  }

  // Type guard for full video documents with details
  function isFullVideoDoc(video: any): video is { video_id: string; id: string; course_data?: any } {
    return video && 'video_id' in video;
  }

  // Helper function to check if a video object has valid course data
  function hasValidCourseData(video: any): boolean {
    return video && 'course_data' in video && !!video.course_data;
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
        setCourseData(existingVideo.course_data);
        toast.success("Course loaded from database");

        // Log the existing course data structure for debugging
        console.log("[GoogleAICourseGenerateButton] Existing course data structure:", {
          hasTitle: !!existingVideo.course_data.title,
          hasDescription: !!existingVideo.course_data.description,
          hasVideoId: !!videoData.id,
          hasCourseItems: Array.isArray(existingVideo.course_data.courseItems) && existingVideo.course_data.courseItems.length > 0,
          courseItemsCount: Array.isArray(existingVideo.course_data.courseItems) ? existingVideo.course_data.courseItems.length : 0,
          hasMetadata: !!existingVideo.course_data.metadata
        });

        // Get transcript for existing course
        const transcriptSegments = await getYoutubeTranscript(videoData.id);
        const transcript = transcriptSegments.map(seg => seg.text).join(" ").trim();

        try {
          // Also save to public courses database
          console.log("[GoogleAICourseGenerateButton] Saving existing course to public database...");
          await saveGeneratedCourseToPublic({
            courseData: {
              title: existingVideo.course_data.title,
              description: existingVideo.course_data.description || "",
              videoId: videoData.id,
              thumbnail: existingVideo.course_data.image || videoData.thumbnail,
              courseItems: existingVideo.course_data.courseItems || [],
              metadata: existingVideo.course_data.metadata || {},
              transcript: transcript // Pass the transcript to the API
            },
            userId: undefined // No user ID for now, could be added later
          });
          console.log("[GoogleAICourseGenerateButton] Successfully saved existing course to public database");
        } catch (err) {
          console.error("Error saving existing course to public database:", err);
          // Don't show error to user as this is a background operation
        }

        return;
      }

      // Get transcript
      const transcriptSegments = await getYoutubeTranscript(videoData.id);
      const transcript = transcriptSegments.map(seg => seg.text).join(" ").trim();

      if (!transcript) {
        throw new Error("Could not retrieve transcript for this video.");
      }

      // Call the API to generate the course
      // Note: This request can take a long time for large videos
      // We intentionally don't set a timeout to allow the ADK service to complete naturally
      abortControllerRef.current = new AbortController();
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
        }),
        // No timeout - let the request complete naturally
        // The ADK service can take a long time for large videos
        signal: abortControllerRef.current.signal
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

      // Log the course data structure for debugging
      console.log("[GoogleAICourseGenerateButton] Course data structure:", {
        hasTitle: !!result.data.title,
        hasDescription: !!result.data.description,
        hasVideoId: !!videoData.id,
        hasCourseItems: Array.isArray(result.data.courseItems) && result.data.courseItems.length > 0,
        courseItemsCount: Array.isArray(result.data.courseItems) ? result.data.courseItems.length : 0,
        hasMetadata: !!result.data.metadata
      });

      try {
        // Save to video cache database
        console.log("[GoogleAICourseGenerateButton] Saving course to video cache database...");
        await updateVideoCourseData({
          youtubeId: videoData.id,
          courseData: result.data
        });
        console.log("[GoogleAICourseGenerateButton] Successfully saved course to video cache database");
      } catch (err) {
        console.error("Error saving to video database:", err);
        // Don't show error to user as this is a background operation
      }

      try {
        // Save to public courses database
        console.log("[GoogleAICourseGenerateButton] Saving course to public database...");
        await saveGeneratedCourseToPublic({
          courseData: {
            title: result.data.title,
            description: result.data.description || "",
            videoId: videoData.id,
            thumbnail: result.data.image || videoData.thumbnail,
            courseItems: result.data.courseItems || [],
            metadata: result.data.metadata || {},
            transcript: transcript // Pass the transcript to the API
          },
          userId: undefined // No user ID for now, could be added later
        });
        console.log("[GoogleAICourseGenerateButton] Successfully saved course to public database");
      } catch (err) {
        console.error("Error saving to public database:", err);
        // Don't show error to user as this is a background operation
      }

    } catch (error) {
      console.error("Course generation error:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to generate course";
      setCourseError(errorMsg);
      toast.error("Course Generation Failed", { description: errorMsg });
    } finally {
      // Always clean up
      setCourseGenerating(false);
      // Clear the abort controller reference
      abortControllerRef.current = null;
    }
  };

  // Cancel function to abort the request if needed
  const cancelGeneration = () => {
    if (abortControllerRef.current) {
      console.log("[GoogleAICourseGenerateButton] Cancelling course generation");
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setCourseGenerating(false);
      toast.info("Course generation cancelled");
    }
  };

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
