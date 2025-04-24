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
}

export function GoogleAICourseGenerateButton({
  className = "",
  size = "lg",
  variant = "default"
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

  const prevCourseGeneratingRef = useRef<boolean>(courseGenerating);

  useEffect(() => {
    if (prevCourseGeneratingRef.current === true && courseGenerating === false) {
      if (courseError) {
        toast.error("Generation Failed", { description: courseError });
      } else if (courseData) {
        toast.success("Course Generated", { description: "Your course has been created!" });
      }
    }
    prevCourseGeneratingRef.current = courseGenerating;
  }, [courseGenerating, courseData, courseError]);

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

      setProgressMessage("Generating course with AI...");
      setGenerationProgress(20);

      const response = await fetch('/api/course-generation/google-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoData.id,
          videoTitle: videoData.title,
          videoDescription: videoData.description || "",
          transcript,
          videoData: videoData
        }),
      });

      if (!response.ok) {
        let errorMsg = `Error: ${response.status}`;
        try { const errData = await response.json(); errorMsg = errData.error || errData.message || errorMsg; } catch { }
        throw new Error(errorMsg);
      }
      const result = await response.json();
      if (!result.data) throw new Error("No course data returned from the API");

      setCourseData(result.data);
      setProgressMessage("Course generation complete!");
      setGenerationProgress(100);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to generate course";
      setCourseError(errorMsg);
      setProgressMessage("Course generation failed");
      setGenerationProgress(0);
    } finally {
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
        <> <Sparkles className="mr-2 h-4 w-4" /> Generate Course </>
      )}
    </Button>
  );
}
