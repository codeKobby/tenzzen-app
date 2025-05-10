// Export all Convex functions for proper discovery
export * from "./admin";
// Import and re-export assessments with explicit naming to avoid conflicts
import { 
  getCourseAssessments,
  createOrUpdateAssessment,
  startAssessment as assessmentsStartAssessment,
  submitQuizAssessment,
  submitProject,
  reviewProjectSubmission,
  generateNewProject
} from "./assessments";

// Re-export assessments functions with renamed startAssessment
export {
  getCourseAssessments,
  createOrUpdateAssessment,
  assessmentsStartAssessment,
  submitQuizAssessment,
  submitProject,
  reviewProjectSubmission,
  generateNewProject
};

export * from "./categories";
export * from "./courses";
export * from "./library";
export * from "./migration_framework";
export * from "./migrations";
export * from "./progress";
export * from "./tasks";
export * from "./transcripts";
export * from "./users";
export * from "./user_stats";
export * from "./videos"; // Ensure videos.ts is exported