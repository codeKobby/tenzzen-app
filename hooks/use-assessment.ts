import { useCallback, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';

interface UseAssessmentProps {
  courseId: Id<"courses">;
  sectionId: string;
  assessmentId: string;
}

export interface AssessmentProgress {
  status: 'not_started' | 'in_progress' | 'completed' | 'graded';
  score?: number;
  feedback?: string;
}

export interface UseAssessmentReturn {
  // Assessment data
  content: any | null;
  isLoading: boolean;
  isGenerating: boolean;
  progress: AssessmentProgress | null;
  isLocked: boolean;

  // Actions
  generateContent: (context: string) => Promise<void>;
  unlockAssessment: () => Promise<void>;
  startAssessment: () => Promise<void>;
  submitAssessment: (submission: any) => Promise<void>;
  
  // Error state
  error: Error | null;
}

export function useAssessment({ 
  courseId, 
  sectionId, 
  assessmentId 
}: UseAssessmentProps): UseAssessmentReturn {
  // Local state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Queries
  const content = useQuery(api.assessments.getAssessmentContent, {
    courseId,
    assessmentId
  });

  const progress = useQuery(api.progress.getAssessmentProgress, {
    courseId,
    assessmentId
  });

  const assessment = useQuery(api.assessments.getSectionAssessments, {
    courseId,
    sectionId
  })?.find(a => a.id === assessmentId);

  // Mutations
  const generate = useMutation(api.assessments.generateAssessment);
  const updateStatus = useMutation(api.assessments.updateAssessmentStatus);
  const startProgress = useMutation(api.progress.startAssessment);
  const submitProgress = useMutation(api.progress.submitAssessment);

  // Generate content if needed
  const generateContent = useCallback(async (context: string) => {
    try {
      setIsGenerating(true);
      setError(null);

      await generate({
        courseId,
        sectionId,
        assessmentId,
        type: assessment?.type ?? 'test', // Default to test if type unknown
        context
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate assessment'));
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [courseId, sectionId, assessmentId, assessment?.type, generate]);

  // Unlock assessment
  const unlockAssessment = useCallback(async () => {
    try {
      setError(null);
      await updateStatus({
        courseId,
        sectionId,
        assessmentId,
        isLocked: false
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to unlock assessment'));
      throw err;
    }
  }, [courseId, sectionId, assessmentId, updateStatus]);

  // Start assessment attempt
  const startAssessment = useCallback(async () => {
    try {
      setError(null);
      await startProgress({
        courseId,
        assessmentId
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start assessment'));
      throw err;
    }
  }, [courseId, assessmentId, startProgress]);

  // Submit assessment
  const submitAssessment = useCallback(async (submission: any) => {
    try {
      setError(null);
      await submitProgress({
        courseId,
        assessmentId,
        submission
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit assessment'));
      throw err;
    }
  }, [courseId, assessmentId, submitProgress]);

  return {
    content: content ?? null,
    isLoading: content === undefined || assessment === undefined,
    isGenerating,
    progress: progress ?? null,
    isLocked: assessment?.isLocked ?? true,
    generateContent,
    unlockAssessment,
    startAssessment,
    submitAssessment,
    error
  };
}

interface UseSectionAssessmentsReturn {
  assessments: any[];
  isLoading: boolean;
}

// Helper hook to get all assessments for a section
export function useSectionAssessments(
  courseId: Id<"courses">, 
  sectionId: string
): UseSectionAssessmentsReturn {
  const assessments = useQuery(api.assessments.getSectionAssessments, {
    courseId,
    sectionId
  });

  return {
    assessments: assessments ?? [],
    isLoading: assessments === undefined
  };
}