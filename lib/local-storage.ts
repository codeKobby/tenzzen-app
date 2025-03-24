/**
 * Helper functions for managing course data in local storage
 */

// Type definitions
export interface LocalEnrollment {
  userId: string;
  courseTitle: string;
  courseData: any;
  enrolledAt: number;
  lastAccessedAt: number;
  progress: number;
  completedLessons: string[];
  courseId?: string;
}

// Get all enrollments from local storage with verbose logging
export function getLocalEnrollments(): LocalEnrollment[] {
  if (typeof window === 'undefined') {
    console.log("getLocalEnrollments called in server context, returning empty array");
    return [];
  }
  
  try {
    const enrollmentsJson = localStorage.getItem('enrollments');
    console.log("Raw enrollments from localStorage:", enrollmentsJson);
    
    if (!enrollmentsJson) {
      console.log("No enrollments found in localStorage");
      return [];
    }
    
    const enrollments = JSON.parse(enrollmentsJson);
    console.log("Parsed enrollments:", enrollments.length, "items found");
    
    if (!Array.isArray(enrollments)) {
      console.error("Enrollments is not an array:", enrollments);
      return [];
    }
    
    return enrollments;
  } catch (e) {
    console.error('Error parsing local enrollments', e);
    return [];
  }
}

// Get enrollments for a specific user with more debugging
export function getUserEnrollments(userId: string): LocalEnrollment[] {
  console.log("getUserEnrollments called for userId:", userId);
  
  if (!userId) {
    console.error("getUserEnrollments called with empty userId");
    return [];
  }
  
  const enrollments = getLocalEnrollments();
  
  // Filter for this user
  console.log(`Filtering ${enrollments.length} enrollments for user ${userId}`);
  const userEnrollments = enrollments.filter(enrollment => enrollment.userId === userId);
  console.log(`Found ${userEnrollments.length} enrollments for user ${userId}`);
  
  // Log all enrollments for debugging
  userEnrollments.forEach((enrollment, i) => {
    console.log(`Enrollment ${i+1}:`, {
      title: enrollment.courseTitle,
      id: enrollment.courseId,
      sections: enrollment.courseData?.sections?.length || 0
    });
  });
  
  // Add courseId to each enrollment if it doesn't exist
  return userEnrollments.map(enrollment => {
    if (!enrollment.courseId) {
      const formattedId = `local-${enrollment.courseTitle.replace(/\s+/g, '-').toLowerCase()}`;
      console.log(`Adding formatted courseId to ${enrollment.courseTitle}:`, formattedId);
      enrollment.courseId = formattedId;
    }
    return enrollment;
  });
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

// Delete an enrollment from local storage
export function deleteUserEnrollment(userId: string, courseId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const enrollments = getLocalEnrollments();
    
    // Log for debugging
    console.log(`Attempting to delete course: ${courseId}`);
    console.log(`Available courses:`, enrollments.map(e => ({
      userId: e.userId,
      title: e.courseTitle,
      formattedId: `local-${e.courseTitle.replace(/\s+/g, '-').toLowerCase()}`
    })));
    
    // Filter out the enrollment to delete - check multiple formats for courseId
    const filteredEnrollments = enrollments.filter(enrollment => {
      if (enrollment.userId !== userId) return true;
      
      const formattedId = `local-${enrollment.courseTitle.replace(/\s+/g, '-').toLowerCase()}`;
      const simpleId = enrollment.courseTitle.replace(/\s+/g, '-').toLowerCase();
      
      return !(formattedId === courseId || 
              simpleId === courseId || 
              enrollment.courseTitle === courseId || 
              enrollment.courseId === courseId);
    });
    
    if (filteredEnrollments.length === enrollments.length) {
      // No enrollment was removed
      console.warn("No enrollment found to delete:", { userId, courseId });
      return;
    }
    
    localStorage.setItem('enrollments', JSON.stringify(filteredEnrollments));
  } catch (e) {
    console.error('Error deleting enrollment from local storage', e);
    throw new Error('Failed to delete enrollment');
  }
}

// Initialize default enrollments if none exist (useful for testing)
export function initDefaultEnrollmentsIfEmpty(userId: string): void {
  if (typeof window === 'undefined') return;
  
  const enrollments = getLocalEnrollments();
  if (enrollments.length === 0) {
    console.log("No enrollments found, initializing default enrollment for testing");
    
    const defaultEnrollment = {
      userId,
      courseTitle: "Getting Started with JavaScript",
      courseData: {
        title: "Getting Started with JavaScript",
        description: "Learn the fundamentals of JavaScript programming",
        thumbnail: "/placeholders/course-thumbnail.jpg",
        sections: [
          {
            title: "Introduction to JavaScript",
            lessons: [
              {
                id: "intro-1",
                title: "Welcome to JavaScript",
                description: "An overview of the course",
                content: "# Welcome to JavaScript\n\nThis course will teach you the fundamentals of JavaScript programming."
              },
              {
                id: "intro-2",
                title: "Setting Up Your Environment",
                description: "Prepare your development environment",
                content: "# Setting Up Your Environment\n\nIn this lesson, you'll learn how to set up your development environment for JavaScript."
              }
            ]
          },
          {
            title: "JavaScript Basics",
            lessons: [
              {
                id: "basics-1",
                title: "Variables and Data Types",
                description: "Learn about variables and data types in JavaScript",
                content: "# Variables and Data Types\n\nJavaScript has several data types including strings, numbers, and booleans."
              },
              {
                id: "basics-2",
                title: "Functions and Scope",
                description: "Understanding functions and scope in JavaScript",
                content: "# Functions and Scope\n\nFunctions are reusable blocks of code that perform specific tasks."
              }
            ]
          }
        ]
      },
      enrolledAt: Date.now(),
      lastAccessedAt: Date.now(),
      progress: 0,
      completedLessons: []
    };
    
    localStorage.setItem('enrollments', JSON.stringify([defaultEnrollment]));
    console.log("Default enrollment created");
  }
}
