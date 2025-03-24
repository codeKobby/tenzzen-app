import { Id } from "@/convex/_generated/dataModel";

export type ResourceType = "article" | "video" | "code" | "document" | "link";

export interface Resource {
  title: string;
  type: ResourceType;
  url: string;
  description: string;
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  content: string;
  startTime: number;
  endTime: number;
  resources: Resource[];
}

// Base assessment without content
export interface AssessmentBase {
  id: string;
  type: "test" | "assignment" | "project";
  title: string;
  description: string;
  position: number;
  isLocked: boolean;
  requiredSkills: string[];
  estimatedDuration: string;
  contentGenerated: boolean;
}

// Assessment with content
export interface TestContent extends AssessmentBase {
  type: "test";
  questions: Array<{
    question: string;
    type: "multiple-choice" | "written";
    options?: string[];
    correctAnswer: string;
    explanation: string;
  }>;
}

export interface AssignmentContent extends AssessmentBase {
  type: "assignment";
  tasks: Array<{
    title: string;
    description: string;
    acceptance: string[];
    hint?: string;
  }>;
}

export interface ProjectContent extends AssessmentBase {
  type: "project";
  guidelines: string;
  submissionFormats: Array<"file upload" | "git repo link">;
  deadline: string;
}

export type AssessmentContent = TestContent | AssignmentContent | ProjectContent;

export interface Section {
  id: string;
  title: string;
  description: string;
  duration: string;
  startTime: number;
  endTime: number;
  lessons: Lesson[];
  assessments: Array<AssessmentBase | AssessmentContent>;
}

export interface Course {
  _id?: Id<"courses">;
  title: string;
  subtitle: string;
  overview: {
    description: string;
    prerequisites: Array<{
      title: string;
      description: string;
      level: "beginner" | "intermediate" | "advanced";
    }>;
    learningOutcomes: Array<{
      title: string;
      description: string;
      category: "skill" | "knowledge" | "tool";
    }>;
    totalDuration: string;
    difficultyLevel: "beginner" | "intermediate" | "advanced";
    skills: string[];
    tools: string[];
  };
  sections: Section[];
  createdAt?: number;
  updatedAt?: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  progress: number;
  lessonsCompleted?: number;
  totalLessons?: number;
  lastAccessed?: number | string | Date;
  videoId?: string;
  isNew?: boolean;
  isEnrolled?: boolean;
  metadata?: {
    difficulty?: string;
    duration?: string;
    category?: string;
    prerequisites?: string[];
    objectives?: string[];
    targetAudience?: string[];
    sources?: any[];
  };
  sections?: any[];
}

export type CourseFilter = "all" | "in-progress" | "completed" | "not-started";
export type CourseCategory = "all" | "programming" | "design" | "business" | "marketing" | "productivity" | string;

// Type guards
export function isTestContent(assessment: AssessmentBase | AssessmentContent): assessment is TestContent {
  return assessment.type === "test" && "questions" in assessment;
}

export function isAssignmentContent(assessment: AssessmentBase | AssessmentContent): assessment is AssignmentContent {
  return assessment.type === "assignment" && "tasks" in assessment;
}

export function isProjectContent(assessment: AssessmentBase | AssessmentContent): assessment is ProjectContent {
  return assessment.type === "project" && "guidelines" in assessment;
}

export function hasContent(assessment: AssessmentBase | AssessmentContent): assessment is AssessmentContent {
  return assessment.contentGenerated;
}

/**
 * Types for course data structures
 */

// Course resource item
export interface CourseResource {
  title: string;
  url: string;
  description?: string;
  type?: string;
}

// Course lesson
export interface CourseLesson {
  id: string;
  title: string;
  description: string;
  content?: string;
  duration?: string;
  keyPoints?: string[];
  resources?: CourseResource[];
}

// Course assessment
export interface CourseAssessment {
  id: string;
  type: string;
  title: string;
  description: string;
  position: number;
  estimatedDuration?: string;
  requiredSkills?: string[];
  questions?: CourseQuestion[];
  isCompleted?: boolean;
  isLocked?: boolean;
}

// Question for assessments
export interface CourseQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: string | number | string[];
  explanation?: string;
  type?: string;
}

// Course section
export interface CourseSection {
  id: string;
  title: string;
  description: string;
  lessons: CourseLesson[];
  assessments?: CourseAssessment[];
}

// Course overview details
export interface CourseOverview {
  description: string;
  prerequisites: string[];
  learningOutcomes: string[];
  totalDuration: string;
  difficultyLevel: string;
  skills: string[];
  tools?: string[];
}

// Course metadata
export interface CourseMetadata {
  category?: string;
  subcategory?: string;
  difficulty: string;
  duration: string;
  objectives?: string[];
  prerequisites?: string[];
  targetAudience?: string[];
  sources?: CourseSource[];
}

// Course source reference
export interface CourseSource {
  name: string;
  type: string;
  avatar: string;
  url: string;
}

// Complete course structure
export interface Course {
  id?: string;
  title: string;
  subtitle?: string;
  description: string;
  videoId?: string;
  thumbnail?: string;
  image?: string;
  overview: CourseOverview;
  metadata: CourseMetadata;
  sections: CourseSection[];
  progress?: number;
  lessonsCompleted?: number;
  totalLessons?: number;
  lastAccessed?: number;
  enrolledAt?: number;
  isNew?: boolean;
  isEnrolled?: boolean;
  rating?: number;
  enrolledCount?: number;
  topics?: {
    current: number;
    total: number;
    currentTitle?: string;
  };
  sources?: CourseSource[];
}