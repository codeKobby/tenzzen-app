"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "./custom-toast";
import { useAnalysis } from "@/hooks/use-analysis-context";

export function GoogleAICourseGenerateButton({ className = "", size = "lg", variant = "default" }) {
  const {
    videoData,
    setCourseData,
    setCourseError,
    setCourseGenerating,
    setProgressMessage,
    setGenerationProgress,
  } = useAnalysis();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateCourse = async () => {
    if (!videoData?.id || !videoData?.title) {
      toast.error("Missing Video Data", { description: "Please select a valid YouTube video first." });
      return;
    }
    setIsGenerating(true);
    setCourseGenerating(true);
    setProgressMessage("Generating course with AI...");
    setGenerationProgress(10);
    try {
      // Call backend to generate course (no transcript fetching)
      const response = await fetch('/api/course-generation/google-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: videoData.id,
          videoTitle: videoData.title,
          videoDescription: videoData.description || "",
          difficulty: "Intermediate"
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
      const result = await response.json();
      if (!result.data) throw new Error("No course data returned from the API");
      setCourseData(result.data);
      setProgressMessage("Course generation complete!");
      setGenerationProgress(100);
      toast.success("Course Generated", { description: "Your course has been created!" });
    } catch (error) {
      setCourseError(error instanceof Error ? error.message : "Failed to generate course");
      toast.error("Generation Failed", { description: error instanceof Error ? error.message : "Failed to generate course" });
      setProgressMessage("Course generation failed");
      setGenerationProgress(0);
    } finally {
      setIsGenerating(false);
      setCourseGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleGenerateCourse}
      disabled={isGenerating}
      className={className}
      variant={variant}
      size={size}
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Course
        </>
      )}
    </Button>
  );
}