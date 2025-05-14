import { Course } from "@/app/courses/types";
import { mockSources } from "./mock/sources";

// Format enrollment data from localStorage/Convex into a Course object for UI
export function formatEnrollmentToCourse(enrollment: any): Course {
  console.log("formatEnrollmentToCourse called with:", enrollment ? {
    title: enrollment.courseTitle,
    hasData: !!enrollment.courseData,
    sections: enrollment.courseData?.sections?.length || 0
  } : "null enrollment");

  // Check for null or undefined enrollment and provide a fallback
  if (!enrollment) {
    console.error("Null enrollment provided to formatEnrollmentToCourse");
    return createDefaultCourse();
  }

  if (!enrollment.courseData) {
    console.error("Enrollment missing courseData:", enrollment);
    return createDefaultCourse(enrollment.courseTitle || "Unknown Course");
  }

  try {
    // Calculate total lessons
    const totalLessons = (enrollment.courseData.sections || []).reduce(
      (acc: number, section: any) => acc + (section.lessons?.length || 0),
      0
    );
    console.log("Total lessons calculated:", totalLessons);

    // Generate a random rating between 4.5 and 5.0
    const rating = 4.5 + Math.random() * 0.5;

    // Generate random enrollment count between 1000-10000
    const enrolledCount = Math.floor(1000 + Math.random() * 9000);

    // Calculate total video duration from sections if available
    const totalDurationMinutes = (enrollment.courseData.sections || []).reduce(
      (total: number, section: any) => {
        // Add section duration if it's a number
        if (typeof section.duration === 'number') {
          return total + section.duration;
        }

        // Or add up lesson durations
        const sectionMinutes = (section.lessons || []).reduce(
          (acc: number, lesson: any) => {
            // Add lesson duration if available
            if (typeof lesson.duration === 'number') {
              return acc + lesson.duration;
            }
            return acc;
          }, 0);

        return total + sectionMinutes;
      }, 0
    );

    // Format duration in hours and minutes
    const durationHours = Math.floor(totalDurationMinutes / 60);
    const durationMinutes = totalDurationMinutes % 60;
    const formattedDuration = totalDurationMinutes > 0
      ? `${durationHours > 0 ? durationHours + 'h' : ''}${durationMinutes > 0 ? ' ' + durationMinutes + 'm' : durationHours > 0 ? '' : '0m'}`
      : '1h 30m'; // Default fallback duration

    // Generate a proper course ID that will match what we're looking for
    const courseId = (() => {
      // If the enrollment already has an ID, use it
      if (enrollment.courseId) {
        return enrollment.courseId;
      }

      // Otherwise, generate an ID from the title
      const normalizedTitle = enrollment.courseTitle.replace(/\s+/g, '-').toLowerCase();
      return `local-${normalizedTitle}`;
    })();

    // For debugging
    console.log("Generated course ID in formatEnrollmentToCourse:", courseId);

    // Extract video details from metadata if available
    const videoDetails = enrollment.courseData.metadata?.videoDetails || {};

    // Extract video ID from various possible sources
    const videoId = (() => {
      // First try direct videoId field
      if (enrollment.courseData.videoId) {
        return enrollment.courseData.videoId;
      }

      // Try to extract from YouTube URL if available
      if (enrollment.courseData.youtubeUrl) {
        const ytRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/;
        const match = enrollment.courseData.youtubeUrl.match(ytRegex);
        if (match) {
          return match[1];
        }
      }

      // Try metadata
      if (enrollment.courseData.metadata?.videoId) {
        return enrollment.courseData.metadata.videoId;
      }

      // Try video_id (Supabase format)
      if (enrollment.courseData.video_id) {
        return enrollment.courseData.video_id;
      }

      return null;
    })();

    console.log("Extracted video ID:", videoId);

    const formattedCourse = {
      id: courseId,
      title: enrollment.courseTitle || enrollment.courseData.title || "Untitled Course",
      description: enrollment.courseData.description || "",
      category: enrollment.courseData.metadata?.category || "Programming",
      image: enrollment.courseData.thumbnail || `/placeholders/course-thumbnail.jpg`,
      thumbnail: enrollment.courseData.thumbnail || `/placeholders/course-thumbnail.jpg`,
      // Add video ID and URL
      videoId: videoId,
      youtubeUrl: enrollment.courseData.youtubeUrl || enrollment.courseData.youtube_url,
      // Add new video details - use || {} for safety
      channelName: videoDetails.channelTitle, // Assuming field name is channelTitle
      channelAvatar: videoDetails.channelAvatar, // Assuming field name
      viewCount: videoDetails.viewCount, // Assuming field name
      likeCount: videoDetails.likeCount, // Assuming field name
      publishedDate: videoDetails.publishedAt, // Assuming field name
      progress: enrollment.progress || 0,
      lessonsCompleted: enrollment.completedLessons?.length || 0,
      totalLessons: totalLessons,
      lastAccessed: enrollment.lastAccessedAt,
      isNew: Date.now() - enrollment.enrolledAt < 7 * 24 * 60 * 60 * 1000, // 7 days
      isEnrolled: true,
      rating: rating,
      enrolledCount: enrolledCount,
      duration: formattedDuration,
      topics: {
        current: enrollment.completedLessons?.length || 0,
        total: totalLessons,
        currentTitle: "Current Topic"
      },
      sources: enrollment.courseData.metadata?.sources || mockSources,
      // Include sections directly for easier access
      sections: enrollment.courseData.sections || []
    };

    console.log("Formatted course successfully:", formattedCourse.title);
    return formattedCourse;
  } catch (error) {
    console.error("Error in formatEnrollmentToCourse:", error);
    return createDefaultCourse(enrollment.courseTitle || "Error Course");
  }
}

// Helper to create a default course object when data is missing
function createDefaultCourse(title: string = "Default Course"): Course {
  console.log("Creating default course with title:", title);

  return {
    id: `error-${Date.now()}`,
    title: title,
    description: "This course failed to load properly. Please try refreshing the page or contact support if the issue persists.",
    category: "Error",
    image: `/placeholders/course-thumbnail.jpg`,
    thumbnail: `/placeholders/course-thumbnail.jpg`,
    videoId: null, // No default video
    progress: 0,
    duration: "N/A",
    isEnrolled: false,
    sections: [], // No default sections
    topics: {
      current: 0,
      total: 0,
      currentTitle: "Error"
    }
  };
}

// Format date for display
export function formatDate(date: string | number | Date | undefined): string {
  if (!date) return '';

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date as any);

    if (isNaN(dateObj.getTime())) return '';

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return dateObj.toLocaleDateString();
  } catch (e) {
    return '';
  }
}
