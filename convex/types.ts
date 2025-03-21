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

// Database types
export interface DbAssessment {
  _id: Id<"assessments">;
  courseId: Id<"courses">;
  sectionId: string;
  assessmentId: string;
  type: "test" | "assignment" | "project";
  content: AssessmentContent;
  isLocked: boolean;
  contentGenerated: boolean;
  createdAt: number;
  updatedAt: number;
}
