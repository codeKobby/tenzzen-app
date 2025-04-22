"use client";

import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button"; // Import ButtonProps
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "./custom-toast";
import { useAnalysis } from "@/hooks/use-analysis-context";
import { getYoutubeTranscript } from "@/actions/getYoutubeTranscript"; // Import getYoutubeTranscript

// Define prop types explicitly
interface GoogleAICourseGenerateButtonProps {
  className?: string;
  size?: ButtonProps['size']; // Use type from ButtonProps
  variant?: ButtonProps['variant']; // Use type from ButtonProps
}

export function GoogleAICourseGenerateButton({
  className = "",
  size = "lg", // Default value is still fine
  variant = "default" // Default value is still fine
}: GoogleAICourseGenerateButtonProps) { // Apply the interface
  const {
    videoData,
    transcript,
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
    setProgressMessage("Fetching transcript...");
    setGenerationProgress(10);
    try {
      // Fetch transcript on demand
      const transcriptSegments = await getYoutubeTranscript(videoData.id);
      const transcript = transcriptSegments.map(seg => seg.text).join(" ").trim(); // Add ()

      if (!transcript) {
        toast.error("Transcript not found", { description: "Could not retrieve transcript for this video." });
        setIsGenerating(false);
        setCourseGenerating(false);
        setProgressMessage("Transcript not found");
        setGenerationProgress(0);
        return;
      }

      // Call backend
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

      // Update State FIRST
      setCourseData(result.data);
      setProgressMessage("Course generation complete!");
      setGenerationProgress(100);
      setIsGenerating(false);
      setCourseGenerating(false);

      // Delay Toast AFTER state updates
      setTimeout(() => {
        toast.success("Course Generated", { description: "Your course has been created!" });
      }, 0);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to generate course";
      // Update State FIRST
      setCourseError(errorMsg);
      setProgressMessage("Course generation failed");
      setGenerationProgress(0);
      setIsGenerating(false);
      setCourseGenerating(false);

      // Delay Toast AFTER state updates
      setTimeout(() => {
        toast.error("Generation Failed", { description: errorMsg });
      }, 0);
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
        <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating... </>
      ) : (
        <> <Sparkles className="mr-2 h-4 w-4" /> Generate Course </>
      )}
    </Button>
  );
}
