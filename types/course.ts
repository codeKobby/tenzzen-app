export interface Resource {
  title: string;
  type: string;
  url: string;
  description: string;
}

export interface Lesson {
  title: string;
  duration: string;
  description: string;
  content: string;
  startTime: number;
  endTime: number;
  resources: Resource[];
}

export interface Section {
  title: string;
  description: string;
  duration: string;
  startTime: number;
  endTime: number;
  lessons: Lesson[];
}

export interface PreRequisite {
  title: string;
  description: string;
  level: string;
}

export interface LearningOutcome {
  title: string;
  description: string;
  category: string;
}

export interface Course {
  title: string;
  subtitle: string;
  overview: {
    description: string;
    prerequisites: PreRequisite[];
    learningOutcomes: LearningOutcome[];
    totalDuration: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    skills: string[];
    tools: string[];
  };
  sections: Section[];
}

// Helper functions
export function findCurrentLesson(course: Course, lessonIndex: number): Lesson | null {
  let currentIndex = 0;
  for (const section of course.sections) {
    for (const lesson of section.lessons) {
      if (currentIndex === lessonIndex) {
        return lesson;
      }
      currentIndex++;
    }
  }
  return null;
}

export function getTotalLessons(course: Course): number {
  return course.sections.reduce((acc, section) => acc + section.lessons.length, 0);
}

export function getLessonGlobalIndex(course: Course, sectionIndex: number, lessonIndex: number): number {
  return course.sections
    .slice(0, sectionIndex)
    .reduce((acc, section) => acc + section.lessons.length, 0) + lessonIndex;
}

export function getSectionForLesson(course: Course, lessonIndex: number): { 
  section: Section; 
  sectionIndex: number; 
  lessonLocalIndex: number; 
} | null {
  let currentIndex = 0;
  
  for (let sectionIndex = 0; sectionIndex < course.sections.length; sectionIndex++) {
    const section = course.sections[sectionIndex];
    const sectionLength = section.lessons.length;
    
    if (currentIndex + sectionLength > lessonIndex) {
      return {
        section,
        sectionIndex,
        lessonLocalIndex: lessonIndex - currentIndex
      };
    }
    
    currentIndex += sectionLength;
  }
  
  return null;
}