"use client";

import React, { createContext, useContext, useCallback, useMemo, useState } from "react";
import { Id } from "@/types/convex-types";
import type {
  AssessmentBase,
  AssessmentContent,
  TestContent,
  AssignmentContent,
  ProjectContent
} from "@/types/course";

// TEMPORARY: This is a stub implementation until Supabase assessment functionality is implemented

interface AssessmentState {
  isLoading: boolean;
  isGenerating: boolean;
  isLocked: boolean;
  progress: {
    status: "not_started" | "in_progress" | "completed" | "graded";
    score?: number;
    feedback?: string;
  } | null;
  error: Error | null;
}

interface AssessmentContextType extends AssessmentState {
  // Assessment data with proper type union
  content: TestContent | AssignmentContent | ProjectContent | null;

  // Actions
  generateContent: (context: string) => Promise<void>;
  unlockAssessment: () => Promise<void>;
  startAssessment: () => Promise<void>;
  submitAssessment: (submission: any) => Promise<void>;
}

interface AssessmentProviderProps {
  courseId: Id<"courses">;
  sectionId: string;
  assessmentId: string;
  assessment: AssessmentBase;
  children: React.ReactNode;
}

const AssessmentContext = createContext<AssessmentContextType | null>(null);

export function AssessmentProvider({
  courseId,
  sectionId,
  assessmentId,
  assessment: initialAssessment,
  children
}: AssessmentProviderProps) {
  // Stub state (temporary until Supabase implementation)
  const [content, setContent] = useState<AssessmentContent | null>(null);
  const [progress, setProgress] = useState<{
    status: "not_started" | "in_progress" | "completed" | "graded";
    score?: number;
    feedback?: string;
  } | null>({
    status: "not_started"
  });

  // Generate content - stub implementation
  const generateContent = useCallback(async (context: string) => {
    console.log('Stub implementation: generateContent', { courseId, sectionId, assessmentId, context });
    // In a real implementation, this would call a Supabase API
    return Promise.resolve();
  }, [courseId, sectionId, assessmentId]);

  // Unlock assessment - stub implementation
  const unlockAssessment = useCallback(async () => {
    console.log('Stub implementation: unlockAssessment', { courseId, sectionId, assessmentId });
    // In a real implementation, this would call a Supabase API
    return Promise.resolve();
  }, [courseId, sectionId, assessmentId]);

  // Start assessment - stub implementation
  const startAssessment = useCallback(async () => {
    console.log('Stub implementation: startAssessment', { courseId, assessmentId });
    setProgress(prev => ({ ...prev, status: "in_progress" }));
    // In a real implementation, this would call a Supabase API
    return Promise.resolve();
  }, [courseId, assessmentId]);

  // Submit assessment - stub implementation
  const submitAssessment = useCallback(async (submission: any) => {
    console.log('Stub implementation: submitAssessment', { courseId, assessmentId, submission });
    setProgress(prev => ({ ...prev, status: "completed", score: 100 }));
    // In a real implementation, this would call a Supabase API
    return Promise.resolve();
  }, [courseId, assessmentId]);

  // Context value - stub implementation
  const value = useMemo<AssessmentContextType>(() => ({
    content: content,
    isLoading: false, // Set to false since we're using stub data
    isGenerating: false,
    isLocked: initialAssessment.isLocked,
    progress: progress,
    generateContent,
    unlockAssessment,
    startAssessment,
    submitAssessment,
    error: null
  }), [
    content,
    initialAssessment.isLocked,
    progress,
    generateContent,
    unlockAssessment,
    startAssessment,
    submitAssessment
  ]);

  return (
    <AssessmentContext.Provider value={value}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error("useAssessment must be used within AssessmentProvider");
  }
  return context;
}
