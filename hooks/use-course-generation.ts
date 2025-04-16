import { useState, useCallback } from 'react';
import { Course } from '@/tools/googleAiCourseSchema';
import { useAnalysis } from '@/hooks/use-analysis-context';

interface UseCourseGenerationProps {
  onSuccess?: (course: Course) => void;
  onError?: (error: Error) => void;
}

export function useCourseGeneration({ onSuccess, onError }: UseCourseGenerationProps = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('Initializing course generation...');
  
  // Get analysis context for the course data
  const analysisContext = useAnalysis();

  // Function to generate a course using the Google AI API
  const generateCourse = useCallback(async (
    videoId: string,
    videoTitle: string,
    videoDescription: string,
    transcript: string,
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced',
    category?: string
  ) => {
    let progressInterval: NodeJS.Timeout | null = null;
    try {
      setIsGenerating(true);
      setError(null);
      setProgress(0);
      setProgressMessage('Initializing course generation...');

      // Enhanced progress steps for better user feedback
      const progressSteps = [
        'Analyzing video content and metadata...',
        'Identifying chapters and key topics...',
        'Structuring course sections and lessons...',
        'Adding learning objectives and prerequisites...',
        'Designing assessments and quizzes...',
        'Finding and linking relevant resources...',
        'Finalizing course structure and details...',
        'Reviewing and validating generated course...',
        'Almost done! Polishing your course...'
      ];

      let progressIndex = 0;
      progressInterval = setInterval(() => {
        if (progressIndex < progressSteps.length) {
          const newProgress = Math.min(Math.round((progressIndex / progressSteps.length) * 100), 98);
          setProgress(newProgress);
          setProgressMessage(progressSteps[progressIndex]);
          progressIndex++;
        }
      }, 1800); // Slightly faster feedback

      // Prepare the API request payload
      const payload = {
        videoId,
        videoTitle,
        videoDescription,
        transcript,
        difficulty,
        category
      };

      // Call the API
      const response = await fetch('/api/course-generation/google-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Check if the response status indicates failure
      if (!response.ok) {
        let errorPayload: any = { message: `HTTP error! status: ${response.status}` };
        try {
          // Attempt to parse more detailed error info from the backend
          errorPayload = await response.json();
        } catch (parseError) {
          // If parsing fails, use the basic HTTP status
          console.error("Failed to parse error response:", parseError);
        }
        // Construct a more informative error message
        const detail = errorPayload.details || errorPayload.error || '';
        const validationErrors = errorPayload.validationErrors ? ` Validation Issues: ${JSON.stringify(errorPayload.validationErrors)}` : '';
        const rawResponseHint = errorPayload.rawResponse ? ` Raw Response Hint: ${errorPayload.rawResponse}` : '';
        throw new Error(`Failed to generate course: ${detail}${validationErrors}${rawResponseHint}`.trim() || errorPayload.message);
      }

      // Parse the successful response
      const result = await response.json();

      // Ensure the response structure is as expected
      if (!result || !result.success || !result.data) {
          throw new Error('Received an unexpected response format from the server.');
      }

      // Clear the progress interval if it exists
      if (progressInterval) clearInterval(progressInterval);
      
      // Set final progress state
      setProgress(100);
      setProgressMessage('Course generation complete!');

      // Call the success callback with the course data
      if (onSuccess) {
        onSuccess(result.data as Course); // Pass the actual course data
      }

      // Reset generating state after a short delay
      setTimeout(() => {
        setIsGenerating(false);
      }, 500);

      return result.data as Course; // Return the course data

    } catch (err: any) {
      // Log the detailed error
      console.error('Course generation error:', err);
      // Use the error message constructed in the !response.ok block or the generic message
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during course generation.';

      setError(errorMessage); // Set the potentially more detailed error message
      setProgressMessage('Course generation failed');
      if (progressInterval) clearInterval(progressInterval); // Ensure interval is cleared on error too
      setProgress(0); // Reset progress on error

      // Call the error callback
      if (onError) {
         // Pass the original error object if it's an Error instance, otherwise create one
         onError(err instanceof Error ? err : new Error(errorMessage));
      }

      setIsGenerating(false);
      // Optionally re-throw if needed upstream, but often UI hooks handle errors internally
      // throw err;
    }
  }, [onSuccess, onError]); // Removed analysisContext if not used directly here

  // Function to cancel the course generation
  const cancelGeneration = useCallback(() => {
    setIsGenerating(false);
    setProgressMessage('Course generation cancelled');
  }, []);

  return {
    generateCourse,
    cancelGeneration,
    isGenerating,
    progress,
    progressMessage,
    error
  };
}
