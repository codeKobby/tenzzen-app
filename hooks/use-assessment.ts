import { useCallback, useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { Id } from '@/types/convex-types';

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
  const [content, setContent] = useState<any | null>(null);
  const [progress, setProgress] = useState<AssessmentProgress | null>(null);
  const [assessment, setAssessment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabase();

  // Fetch assessment data
  useEffect(() => {
    async function fetchAssessmentData() {
      try {
        setIsLoading(true);

        // Fetch assessment content
        const { data: contentData, error: contentError } = await supabase
          .from('assessment_content')
          .select('*')
          .eq('assessment_id', assessmentId)
          .single();

        if (contentError && contentError.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error fetching assessment content:', contentError);
        }

        // Fetch assessment progress
        const { data: progressData, error: progressError } = await supabase
          .from('assessment_progress')
          .select('*')
          .eq('assessment_id', assessmentId)
          .eq('course_id', courseId)
          .single();

        if (progressError && progressError.code !== 'PGRST116') {
          console.error('Error fetching assessment progress:', progressError);
        }

        // Fetch assessment details
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('assessments')
          .select('*')
          .eq('section_id', sectionId)
          .eq('course_id', courseId);

        if (assessmentsError) {
          console.error('Error fetching assessments:', assessmentsError);
        }

        setContent(contentData || null);
        setProgress(progressData ? {
          status: progressData.status,
          score: progressData.score,
          feedback: progressData.feedback
        } : null);

        const foundAssessment = assessmentsData?.find(a => a.id === assessmentId) || null;
        setAssessment(foundAssessment);

      } catch (err) {
        console.error('Error in fetchAssessmentData:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch assessment data'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssessmentData();
  }, [supabase, courseId, sectionId, assessmentId]);

  // Generate content if needed
  const generateContent = useCallback(async (context: string) => {
    try {
      setIsGenerating(true);
      setError(null);

      // This would typically call an AI service to generate assessment content
      // For now, we'll create a stub implementation
      console.log('Generating assessment content with context:', context);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Insert generated content into Supabase
      const { error } = await supabase
        .from('assessment_content')
        .upsert({
          assessment_id: assessmentId,
          course_id: courseId,
          content: {
            title: 'Generated Assessment',
            description: 'This assessment was generated based on the provided context.',
            questions: [
              {
                question: 'Sample question based on the context',
                options: ['Option A', 'Option B', 'Option C', 'Option D'],
                correctAnswer: 0
              }
            ]
          },
          generated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to save generated content: ${error.message}`);
      }

      // Refresh content
      const { data: newContent } = await supabase
        .from('assessment_content')
        .select('*')
        .eq('assessment_id', assessmentId)
        .single();

      setContent(newContent);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate assessment'));
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, [courseId, sectionId, assessmentId, assessment?.type, supabase]);

  // Unlock assessment
  const unlockAssessment = useCallback(async () => {
    try {
      setError(null);

      // Update assessment locked status in Supabase
      const { error } = await supabase
        .from('assessments')
        .update({ is_locked: false })
        .eq('id', assessmentId)
        .eq('course_id', courseId)
        .eq('section_id', sectionId);

      if (error) {
        throw new Error(`Failed to unlock assessment: ${error.message}`);
      }

      // Update local state
      setAssessment(prev => prev ? { ...prev, is_locked: false } : null);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to unlock assessment'));
      throw err;
    }
  }, [courseId, sectionId, assessmentId, supabase]);

  // Start assessment attempt
  const startAssessment = useCallback(async () => {
    try {
      setError(null);

      // Create or update progress record in Supabase
      const { error } = await supabase
        .from('assessment_progress')
        .upsert({
          assessment_id: assessmentId,
          course_id: courseId,
          status: 'in_progress',
          started_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to start assessment: ${error.message}`);
      }

      // Update local state
      setProgress(prev => ({
        ...prev,
        status: 'in_progress'
      }));

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to start assessment'));
      throw err;
    }
  }, [courseId, assessmentId, supabase]);

  // Submit assessment
  const submitAssessment = useCallback(async (submission: any) => {
    try {
      setError(null);

      // Update progress record with submission in Supabase
      const { error } = await supabase
        .from('assessment_progress')
        .update({
          status: 'completed',
          submission: submission,
          completed_at: new Date().toISOString()
        })
        .eq('assessment_id', assessmentId)
        .eq('course_id', courseId);

      if (error) {
        throw new Error(`Failed to submit assessment: ${error.message}`);
      }

      // Update local state
      setProgress(prev => ({
        ...prev,
        status: 'completed'
      }));

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit assessment'));
      throw err;
    }
  }, [courseId, assessmentId, supabase]);

  return {
    content,
    isLoading,
    isGenerating,
    progress,
    isLocked: assessment?.is_locked ?? true,
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
  const [assessments, setAssessments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useSupabase();

  useEffect(() => {
    async function fetchAssessments() {
      try {
        setIsLoading(true);

        const { data, error } = await supabase
          .from('assessments')
          .select('*')
          .eq('course_id', courseId)
          .eq('section_id', sectionId);

        if (error) {
          console.error('Error fetching section assessments:', error);
          setAssessments([]);
        } else {
          setAssessments(data || []);
        }
      } catch (err) {
        console.error('Error in fetchAssessments:', err);
        setAssessments([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssessments();
  }, [supabase, courseId, sectionId]);

  return {
    assessments,
    isLoading
  };
}