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
  placeholder: boolean;
}

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

export function isCourse(obj: any): obj is Course {
  return (
    typeof obj === "object" &&
    typeof obj.title === "string" &&
    typeof obj.description === "string" &&
    typeof obj.videoId === "string" &&
    Array.isArray(obj.sections) &&
    obj.sections.every(isSection)
  );
}
