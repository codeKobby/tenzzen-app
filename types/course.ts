export type ResourceType = "documentation" | "tutorial" | "article" | "video" | "code" | "blog";

export interface Resource {
  title: string;
  type: ResourceType;
  url: string;
  description: string;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  startTime: number;
  endTime: number;
  keyPoints: string[];
}

export interface Section {
  id: string;
  title: string;
  description: string;
  startTime: number;
  endTime: number;
  objective: string;
  keyPoints: string[];
  lessons: Lesson[];
  assessment?: "quiz" | "assignment";
}

export interface Metadata {
  title: string;
  description: string;
  duration: string;
  category: string;
  tags: string[];
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  prerequisites: string[];
  objectives: string[];
  overviewText?: string;
  sources?: Resource[];
}

export interface Assessment {
  type: "quiz";
  title: string;
  description: string;
  placeholder: boolean; // Indicates if content needs generation
  estimatedDuration?: string; // e.g., "15 minutes"
}

// Specific Assessment Content Types
export interface TestContent {
  type: "test";
  questions: Array<{
    question: string;
    // Add other relevant fields like options, answer, etc.
  }>;
  estimatedDuration?: string;
}

export interface AssignmentContent {
  type: "assignment";
  tasks: Array<{
    title: string;
    description: string;
    // Add other relevant fields like submission format, etc.
  }>;
  estimatedDuration?: string;
}

export interface ProjectContent {
  type: "project";
  guidelines: string;
  deadline?: string; // Consider using a Date type if needed
  estimatedDuration?: string;
  // Add other relevant fields like deliverables, evaluation criteria, etc.
}

// Union type for detailed assessment content
export type AssessmentDetails = TestContent | AssignmentContent | ProjectContent;

// Base type expected by the card (might need adjustment based on useAssessment hook)
// For now, let's assume AssessmentBase is the same as the basic Assessment
export type AssessmentBase = Assessment;


export interface Course {
  id?: string; // Generic ID field, not tied to any specific database
  videoId: string;
  title: string;
  description: string;
  image?: string;
  metadata: Metadata;
  resources: Resource[];
  sections: Section[];
  assessments: Assessment[];
  // Optional fields for UI state
  progress?: number;
  lessonsCompleted?: number;
  totalLessons?: number;
  lastAccessed?: number;
  isEnrolled?: boolean;
}

// Type Guards
export function isResource(obj: any): obj is Resource {
  return (
    typeof obj === "object" &&
    typeof obj.title === "string" &&
    typeof obj.url === "string" &&
    typeof obj.type === "string" &&
    typeof obj.description === "string"
  );
}

export function isLesson(obj: any): obj is Lesson {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.description === "string" &&
    typeof obj.duration === "string" &&
    typeof obj.startTime === "number" &&
    typeof obj.endTime === "number" &&
    Array.isArray(obj.keyPoints)
  );
}

export function isSection(obj: any): obj is Section {
  return (
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    typeof obj.title === "string" &&
    typeof obj.description === "string" &&
    typeof obj.startTime === "number" &&
    typeof obj.endTime === "number" &&
    typeof obj.objective === "string" &&
    Array.isArray(obj.keyPoints) &&
    Array.isArray(obj.lessons) &&
    obj.lessons.every(isLesson)
  );
}

// Type Guards for specific assessment content
export function isTestContent(content: any): content is TestContent {
  return typeof content === 'object' && content !== null && content.type === 'test' && Array.isArray(content.questions);
}

export function isAssignmentContent(content: any): content is AssignmentContent {
  return typeof content === 'object' && content !== null && content.type === 'assignment' && Array.isArray(content.tasks);
}

export function isProjectContent(content: any): content is ProjectContent {
  return typeof content === 'object' && content !== null && content.type === 'project' && typeof content.guidelines === 'string';
}


export function isCourse(obj: any): obj is Course {
  return (
    typeof obj === "object" &&
    obj !== null && // Added null check
    typeof obj.title === "string" &&
    typeof obj.description === "string" &&
    typeof obj.videoId === "string" &&
    typeof obj.metadata === "object" && // Added check for metadata
    Array.isArray(obj.sections) &&
    obj.sections.every(isSection) &&
    Array.isArray(obj.resources) && // Added check for resources
    Array.isArray(obj.assessments) // Added check for assessments
  );
}
