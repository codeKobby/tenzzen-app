"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import type { 
  AssessmentBase, 
  AssessmentContent,
  TestContent,
  AssignmentContent,
  ProjectContent
} from "@/types/course";

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
  // Queries
  const content = useQuery(api.assessments.getAssessmentContent, {
    courseId,
    assessmentId
  });

  const progress = useQuery(api.progress.getAssessmentProgress, {
    courseId,
    assessmentId
  });

  // Mutations
  const generate = useMutation(api.assessments.generateAssessment);
  const updateStatus = useMutation(api.assessments.updateAssessmentStatus);
  const startProgress = useMutation(api.progress.startAssessment);
  const submitProgress = useMutation(api.progress.submitAssessment);

  // Generate content
  const generateContent = useCallback(async (context: string) => {
    try {
      await generate({
        courseId,
        sectionId,
        assessmentId,
        type: initialAssessment.type,
        context
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to generate content");
    }
  }, [courseId, sectionId, assessmentId, initialAssessment.type, generate]);

  // Unlock assessment
  const unlockAssessment = useCallback(async () => {
    try {
      await updateStatus({
        courseId,
        sectionId,
        assessmentId,
        isLocked: false
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to unlock assessment");
    }
  }, [courseId, sectionId, assessmentId, updateStatus]);

  // Start assessment
  const startAssessment = useCallback(async () => {
    try {
      await startProgress({
        courseId,
        assessmentId
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to start assessment");
    }
  }, [courseId, assessmentId, startProgress]);

  // Submit assessment
  const submitAssessment = useCallback(async (submission: any) => {
    try {
      await submitProgress({
        courseId,
        assessmentId,
        submission
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error("Failed to submit assessment");
    }
  }, [courseId, assessmentId, submitProgress]);

  // Context value
  const value = useMemo<AssessmentContextType>(() => ({
    content: (content as AssessmentContent) ?? null,
    isLoading: content === undefined || progress === undefined,
    isGenerating: false,
    isLocked: initialAssessment.isLocked,
    progress: progress ?? null,
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
