/**
 * Helper functions for managing course data in local storage
 * This is used as a fallback when Convex is not available
 */

// Type definitions
interface LocalEnrollment {
  userId: string;
  courseTitle: string;
  courseData: any;
  enrolledAt: number;
  lastAccessedAt: number;
  progress: number;
  completedLessons: string[];
}

// Get all enrollments from local storage
export function getLocalEnrollments(): LocalEnrollment[] {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('enrollments') || '[]');
  } catch (e) {
    console.error('Error parsing local enrollments', e);
    return [];
  }
}

// Get enrollments for a specific user
export function getUserEnrollments(userId: string): LocalEnrollment[] {
  const enrollments = getLocalEnrollments();
  return enrollments.filter(enrollment => enrollment.userId === userId);
}

// Save an enrollment to local storage
export function saveEnrollment(enrollment: LocalEnrollment): void {
  if (typeof window === 'undefined') return;
  
  try {
    const enrollments = getLocalEnrollments();
    
    // Check if enrollment already exists
    const existingIndex = enrollments.findIndex(
      e => e.userId === enrollment.userId && e.courseTitle === enrollment.courseTitle
    );
    
    if (existingIndex >= 0) {
      // Update existing enrollment
      enrollments[existingIndex] = {
        ...enrollments[existingIndex],
        ...enrollment,
        lastAccessedAt: Date.now()
      };
    } else {
      // Add new enrollment
      enrollments.push(enrollment);
    }
    
    localStorage.setItem('enrollments', JSON.stringify(enrollments));
  } catch (e) {
    console.error('Error saving enrollment to local storage', e);
  }
}

// Update enrollment progress
export function updateEnrollmentProgress(
  userId: string,
  courseTitle: string,
  progress: number,
  completedLessons?: string[]
): void {
  if (typeof window === 'undefined') return;
  
  try {
    const enrollments = getLocalEnrollments();
    const existingIndex = enrollments.findIndex(
      e => e.userId === userId && e.courseTitle === courseTitle
    );
    
    if (existingIndex >= 0) {
      // Update progress and last accessed time
      enrollments[existingIndex] = {
        ...enrollments[existingIndex],
        progress,
        lastAccessedAt: Date.now(),
        ...(completedLessons ? { completedLessons } : {})
      };
      
      localStorage.setItem('enrollments', JSON.stringify(enrollments));
    }
  } catch (e) {
    console.error('Error updating enrollment progress', e);
  }
}

// Get recently added enrollments
export function getRecentEnrollments(userId: string, limit: number = 4): LocalEnrollment[] {
  const userEnrollments = getUserEnrollments(userId);
  
  // Sort by enrolled date (most recent first) and limit
  return userEnrollments
    .sort((a, b) => b.enrolledAt - a.enrolledAt)
    .slice(0, limit);
}

// Clear all enrollments (for testing)
export function clearEnrollments(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('enrollments');
}
