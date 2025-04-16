"use client";

import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button'; // Import buttonVariants
import type { VariantProps } from 'class-variance-authority'; // Import VariantProps
import { Loader2, Sparkles } from 'lucide-react';
import { useAnalysis } from '@/hooks/use-analysis-context';
import { useCourseGeneration } from '@/hooks/use-course-generation'; // Import the hook
import { toast } from '@/components/custom-toast';
import { createAILogger } from '@/lib/ai/debug-logger';
import { Course } from '@/tools/googleAiCourseSchema'; // Import Course type

// Create a logger for the component
const logger = createAILogger('GoogleAICourseGenerateButton');

// Use VariantProps to get the correct types from buttonVariants
interface GoogleAICourseGenerateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  // Add any additional specific props for this component here if needed
  // className is already included via React.ButtonHTMLAttributes
}

export function GoogleAICourseGenerateButton({
  className,
  size, // Let the underlying Button handle default
  variant, // Let the underlying Button handle default
  ...props // Pass other button props through
}: GoogleAICourseGenerateButtonProps) {
  // Removed transcript-related state

  // Get analysis context to access video data and update central state
  const {
    videoData,
    setCourseGenerating, // We'll use the hook's state for UI, but context setters for final result
    setCourseData,
    setCourseError,
    setProgressMessage: setContextProgressMessage, // Alias context setters
    setGenerationProgress: setContextGenerationProgress,
  } = useAnalysis();

  // Use the course generation hook
  const {
    generateCourse: hookGenerateCourse, // Alias the hook's function
    isGenerating, // Use hook's generating state for UI
    progress, // Use hook's progress state
    progressMessage, // Use hook's progress message
    error: generationError, // Use hook's error state
  } = useCourseGeneration({
    // Provide callbacks to update the central analysis context state
    onSuccess: (course: Course) => {
      logger.info("Hook onSuccess callback triggered.", { courseTitle: course.title });
      setCourseData(course);
      setContextGenerationProgress(100); // Update context progress
      setContextProgressMessage("Course generation complete!"); // Update context message
      setCourseGenerating(false); // Update context generating state
      toast.success("Course Generated", {
        description: "Your AI course was created successfully!"
      });
    },
    onError: (error: Error) => {
      logger.error("Hook onError callback triggered.", error);
      // Construct detailed error message (similar to previous logic but using hook error)
      let detailedErrorMessage = error.message || "An unknown error occurred during generation.";
      if (detailedErrorMessage.includes('API key') || detailedErrorMessage.includes('authentication')) {
        detailedErrorMessage += " Check if your Google AI API key is valid or if the server has a valid API key configured.";
      } else if (detailedErrorMessage.includes('HTML')) {
        detailedErrorMessage += " The server may have authentication issues with Google AI. Contact your administrator or try refreshing the page.";
      } else if (detailedErrorMessage.includes('Validation Issues')) {
        detailedErrorMessage = `Generated course data is invalid. ${detailedErrorMessage}`;
      }

      setCourseError(detailedErrorMessage);
      setContextGenerationProgress(0); // Reset context progress
      setContextProgressMessage("Course generation failed"); // Update context message
      setCourseGenerating(false); // Update context generating state
      toast.error("Generation Failed", {
        description: error.message // Show the core error message from the hook
      });
    }
  });

  // Removed transcript-related logic

  // Handle course generation trigger
  const handleGenerateCourse = async () => {
    logger.debug("handleGenerateCourse triggered.");
    if (!videoData?.id || !videoData?.title) {
      logger.warn("Generate course clicked without video data.");
      toast.error("Missing Video Data", {
        description: "Please select a valid YouTube video first."
      });
      return;
    }

    // Removed pre-check API key validation block

    // --- Start Generation using the Hook ---
    try {
      logger.info(`Starting course generation for video: ${videoData.title} (ID: ${videoData.id})`);
      // Set initial context state (hook will manage its own internal state)
      setCourseGenerating(true);
      setCourseError(null);
      setContextGenerationProgress(10); // Initial progress
      setContextProgressMessage("Initializing course generation...");

      // Call the hook's generate function
      // The hook will now handle the API call, progress updates, and callbacks
      await hookGenerateCourse(
        videoData.id,
        videoData.title,
        videoData.description || "",
        "", // Removed transcriptText
        'Beginner' // Example: Pass difficulty if needed, or get from state/props
        // category // Pass category if needed
      );

      // The hook's onSuccess/onError callbacks will handle the final state updates

    } catch (error) {
      // This catch block might be redundant if the hook handles errors and calls onError
      // But keep it as a fallback for unexpected issues during the setup phase
      logger.error("Unexpected error during handleGenerateCourse setup:", error);
      setCourseGenerating(false); // Ensure loading state is reset
      setCourseError(error instanceof Error ? error.message : "An unknown error occurred before generation started.");
      toast.error("Generation Failed", {
        description: "An unexpected error occurred."
      });
    }
  };

  // Button is disabled if the hook reports generating, or no video data
  const isButtonDisabled = isGenerating || !videoData?.id;

  return (
    <Button
      className={className}
      size={size}
      variant={variant} // Pass variant prop
      onClick={handleGenerateCourse}
      disabled={isButtonDisabled}
      {...props} // Spread remaining props
    >
      {isGenerating ? ( // Use hook's isGenerating state
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {progressMessage || 'Generating...'} {/* Display hook's progress message */}
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
