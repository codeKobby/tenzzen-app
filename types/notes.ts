export interface Note {
  id: string;
  userId: string;
  courseId?: string;
  lessonId?: string;
  title: string;
  content: string;
  category: 'course' | 'personal' | 'code' | 'starred';
  tags: string[];
  starred: boolean;
  createdAt: string;
  updatedAt: string;
  // Optional fields for UI display
  course?: string;
  preview?: string;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  category: 'course' | 'personal' | 'code';
  courseId?: string;
  lessonId?: string;
  tags?: string[];
}

export interface UpdateNoteInput {
  id: string;
  title?: string;
  content?: string;
  category?: 'course' | 'personal' | 'code';
  tags?: string[];
  starred?: boolean;
}

export type CategoryFilter = 'all' | 'course' | 'personal' | 'code' | 'starred';
export type SortOption = 'recent' | 'oldest' | 'alphabetical' | 'category';
