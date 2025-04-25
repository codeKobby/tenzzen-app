import { Id } from "./_generated/dataModel";

// Content-specific types without base assessment fields
export interface TestQuestions {
  question: string;
  type: "multiple-choice" | "written";
  options?: string[];
  correctAnswer: string;
  explanation: string;
}

export interface AssignmentTask {
  title: string;
  description: string;
  acceptance: string[];
  hint?: string;
}

// Content types for database
export interface TestContent {
  title: string;
  description: string;
  questions: TestQuestions[];
}

export interface AssignmentContent {
  title: string;
  description: string;
  tasks: AssignmentTask[];
}

export interface ProjectContent {
  title: string;
  description: string;
  guidelines: string;
  submissionFormats: Array<"file upload" | "git repo link">;
  deadline: string;
}

export type AssessmentContent = 
  | ({ type: "test" } & TestContent)
  | ({ type: "assignment" } & AssignmentContent)
  | ({ type: "project" } & ProjectContent);

// Progress status types
export type ProgressStatus = "not_started" | "in_progress" | "completed" | "graded";

// Database types for assessments - matches schema definition
export interface DbAssessment {
  _id: Id<"assessments">;
  title: string;
  description: string;
  courseId: Id<"courses">;
  type: string;
  questions?: any[];
  instructions?: string;
  createdAt: number;
}

// Database types for progress tracking
export interface DbProgress {
  _id: Id<"progress">;
  userId: string;
  assessmentId: Id<"assessments">;
  status: ProgressStatus;
  score?: number;
  feedback?: string;
  submission?: any;
  startedAt?: number;
  completedAt?: number;
}
