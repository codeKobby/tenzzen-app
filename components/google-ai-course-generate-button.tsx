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

    // Add retry mechanism
    const maxRetries = 2;
    let retryCount = 0;
    let lastError = null;

    while (retryCount <= maxRetries) {
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

      console.log("[GoogleAICourseGenerateButton] Calling course generation API...");

      // Add a timeout for the initial connection
      const timeoutId = setTimeout(() => {
        console.log("[GoogleAICourseGenerateButton] Request timed out, but not aborting to allow background processing");
        // We don't abort the request, just log the timeout
        // This allows the request to continue in the background
      }, 30000); // 30 second timeout for logging purposes only

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

      // Clear the timeout
      clearTimeout(timeoutId);

      console.log("[GoogleAICourseGenerateButton] Received response from course generation API:", response.status);

      if (!response.ok) {
        // Get more detailed error information from the response
        const errorData = await response.json().catch(() => ({ error: `Error: ${response.status}` }));
        const errorMessage = errorData.error || `Error: ${response.status}`;

        console.log("[GoogleAICourseGenerateButton] Error response details:", {
          status: response.status,
          errorMessage,
          errorData
        });

        // Check for specific status codes
        if (response.status === 503) {
          // Service Unavailable - The ADK service is not running or not accessible
          console.error("[GoogleAICourseGenerateButton] ADK Service Unavailable:", errorMessage);

          // Try to get more specific information about the error
          if (errorMessage.includes("Headers Timeout")) {
            throw new Error(`ADK Service Headers Timeout: The service is running but not responding properly. This might be due to high load or a configuration issue.`);
          } else if (errorMessage.includes("connection refused")) {
            throw new Error(`ADK Service Connection Refused: The service is not running. Please ensure the ADK service is running at http://localhost:8001 with 'cd adk_service; uvicorn server:app --reload'`);
          } else {
            throw new Error(`ADK Service Unavailable: ${errorMessage}. Please ensure the ADK service is running at http://localhost:8001 with 'cd adk_service; uvicorn server:app --reload'`);
          }
        } else if (response.status === 504) {
          // Gateway Timeout - The ADK service is running but taking too long to respond
          console.error("[GoogleAICourseGenerateButton] ADK Service Timeout:", errorMessage);
          throw new Error(`ADK Service Timeout: ${errorMessage}. The service might be running but taking too long to respond.`);
        } else if (response.status === 502) {
          // Bad Gateway - The ADK service is running but returning an error
          console.error("[GoogleAICourseGenerateButton] ADK Service Error:", errorMessage);
          throw new Error(`ADK Service Error: ${errorMessage}. The service might be running but returning an error.`);
        } else {
          // Other errors
          console.error("[GoogleAICourseGenerateButton] Unexpected error:", errorMessage);
          throw new Error(`Error ${response.status}: ${errorMessage}`);
        }
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

        // If we reach here, we've successfully completed the request
        break;
      } catch (error) {
        console.error(`Course generation error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
        lastError = error;

        // Check if this is a 503 error (Service Unavailable)
        const errorMsg = error instanceof Error ? error.message : "Failed to generate course";
        const is503Error = errorMsg.includes("503") || errorMsg.toLowerCase().includes("service unavailable");
        const is504Error = errorMsg.includes("504") || errorMsg.toLowerCase().includes("gateway timeout");

        // If we have retries left and it's a 503 or 504 error, retry
        if (retryCount < maxRetries && (is503Error || is504Error)) {
          retryCount++;
          const retryDelay = 2000 * retryCount; // Exponential backoff

          // Inform the user about the retry
          toast.info(`Retrying course generation (${retryCount}/${maxRetries})`, {
            description: `The ADK service is not responding. Retrying in ${retryDelay/1000} seconds...`
          });

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }

        // If we've exhausted all retries or it's not a retryable error, throw the error
        setCourseError(errorMsg);
        toast.error("Course Generation Failed", { description: errorMsg });
        break;
      }
    } // End of while loop

    // Always clean up
    setCourseGenerating(false);
    // Clear the abort controller reference
    abortControllerRef.current = null;
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



  // If we're generating, show a loading indicator
  if (courseGenerating) {
    return (
      <div className="flex flex-col items-center space-y-4 w-full">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Generating course...</span>
        </div>
      </div>
    );
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
