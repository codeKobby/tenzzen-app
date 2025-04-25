"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "./custom-toast";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript";

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

  const handleGenerateCourse = async () => {
    if (!videoData?.id || !videoData?.title) {
      toast.error("Missing Video Data", { description: "Please select a valid YouTube video first." });
      return;
    }
    setCourseGenerating(true);
    setCourseError(null);
    setCourseData(null);
    setProgressMessage("Fetching transcript...");
    setGenerationProgress(10);

    try {
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

      // Show progress at 100% for course generation completion
      setProgressMessage("Course generation complete!");
      setGenerationProgress(100);

      // Add the videoId to the course data if it's missing
      const finalData = result.data;
      if (!finalData.videoId && videoData.id) {
        finalData.videoId = videoData.id;
      }

      setCourseData(finalData);
      toast.success("Course generated successfully!");
      setCourseGenerating(false);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to generate course";
      setCourseError(errorMsg);
      setProgressMessage("Course generation failed");
      setGenerationProgress(0);
      toast.error("Generation Failed", { description: errorMsg });
      setCourseGenerating(false);
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
        <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating... </>
      ) : (
        <> <Sparkles className="mr-2 h-4 w-4" /> {buttonText} </>
      )}
    </Button>
  );
}
