export type ProjectStatus = 'Not Started' | 'In Progress' | 'Submitted' | 'Graded'

export interface Project {
  id: string
  title: string
  description: string
  status: ProjectStatus
  courses: ProjectCourse[]
  dueDate?: string
  submissionDate?: string
  createdAt: string
  thumbnail?: string
  submissionType?: 'file' | 'link' | 'both'
  feedback?: ProjectFeedback
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
}

export interface ProjectCourse {
  id: string
  title: string
  slug: string
}

export interface ProjectFeedback {
  id: string
  content: string
  grade?: number
  createdAt: string
}

export interface FileSubmission {
  id: string
  filename: string
  fileUrl: string
  fileType: string
  uploadedAt: string
}

export interface LinkSubmission {
  id: string
  url: string
  title: string
  description?: string
  submittedAt: string
}

export interface ProjectSubmission {
  id: string
  projectId: string
  userId: string
  files?: FileSubmission[]
  links?: LinkSubmission[]
  submittedAt: string
  status: 'Pending' | 'Reviewed'
}

export type ProjectFilter = 'all' | 'pending' | 'submitted' | 'graded'
export type ProjectViewMode = 'grid' | 'course-grouped'
export type ProjectSortOption = 'deadline' | 'title' | 'recent'