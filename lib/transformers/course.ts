import { parseDurationToSeconds, calculateTotalDurationFromSections } from "../utils/duration";

/**
 * Transform ADK course data to database format
 * Standardizes duration and lesson count fields
 */
export function transformADKCourseToDatabase(adkCourse: any) {
  if (!adkCourse) {
    throw new Error("Invalid course data");
  }

  // Calculate total duration in seconds
  let durationSeconds = 0;

  // Try to get duration from metadata
  if (adkCourse.metadata?.duration) {
    // Parse from hours to seconds if it's in hours format
    durationSeconds = parseDurationToSeconds(adkCourse.metadata.duration);
  }

  // If no duration in metadata, try to calculate from sections and lessons
  if (durationSeconds === 0 && Array.isArray(adkCourse.courseItems)) {
    durationSeconds = calculateTotalDurationFromSections(adkCourse.courseItems);
  }

  // Calculate total lessons
  let totalLessons = 0;
  if (Array.isArray(adkCourse.courseItems)) {
    for (const item of adkCourse.courseItems) {
      if (item.type === 'section' && Array.isArray(item.lessons)) {
        totalLessons += item.lessons.length;
      }
    }
  }

  return {
    title: adkCourse.title,
    description: adkCourse.description || null,
    video_id: adkCourse.videoId,
    youtube_url: adkCourse.youtubeUrl || `https://www.youtube.com/watch?v=${adkCourse.videoId}`,
    thumbnail: adkCourse.thumbnail || adkCourse.image || null,
    is_public: true,
    status: 'published',
    difficulty_level: adkCourse.metadata?.difficulty || 'beginner',
    // Store duration in multiple formats for backward compatibility
    duration_seconds: durationSeconds,
    estimated_duration: durationSeconds > 0 ? `${Math.floor(durationSeconds / 3600)}:${Math.floor((durationSeconds % 3600) / 60)}:${durationSeconds % 60}` : null,
    estimated_hours: durationSeconds > 0 ? (durationSeconds / 3600) : null,
    // Store total lessons
    total_lessons: totalLessons,
    tags: Array.isArray(adkCourse.metadata?.tags) ? adkCourse.metadata.tags : [],
    category: adkCourse.metadata?.category || null,
    metadata: {
      overview: adkCourse.metadata?.overviewText || null,
      prerequisites: adkCourse.metadata?.prerequisites || [],
      objectives: adkCourse.metadata?.objectives || [],
      resources: adkCourse.resources || adkCourse.metadata?.sources || []
    },
    generated_summary: adkCourse.metadata?.overviewText || null,
    course_items: adkCourse.courseItems || [], // Keep for backward compatibility
    transcript: adkCourse.transcript || null // Keep for backward compatibility
  };
}

/**
 * Transform database course to frontend format
 * Ensures consistent data structure for UI components
 */
export function transformDatabaseCourseToFrontend(dbCourse: any) {
  if (!dbCourse) {
    return null;
  }

  // Calculate total lessons if not already available
  const totalLessons = dbCourse.total_lessons || (() => {
    if (dbCourse.course_items && Array.isArray(dbCourse.course_items)) {
      return dbCourse.course_items.reduce((total: number, item: any) => {
        if (item.type === 'section' && Array.isArray(item.lessons)) {
          return total + item.lessons.length;
        }
        return total;
      }, 0);
    }
    return 0;
  })();

  // Normalize sections from course_items
  const sections = Array.isArray(dbCourse.course_items) 
    ? dbCourse.course_items
        .filter((item: any) => item.type === 'section')
        .map((section: any) => ({
          id: section.id || `section-${Math.random().toString(36).substring(2, 9)}`,
          title: section.title,
          description: section.description || "",
          lessons: Array.isArray(section.lessons) 
            ? section.lessons.map((lesson: any) => ({
                id: lesson.id || `lesson-${Math.random().toString(36).substring(2, 9)}`,
                title: lesson.title,
                description: lesson.description || lesson.content || "",
                duration: lesson.duration || 0,
                videoId: dbCourse.video_id,
                startTime: lesson.startTime || lesson.videoTimestamp || 0,
                endTime: lesson.endTime || 0,
                completed: false
              }))
            : []
        }))
    : [];

  return {
    id: dbCourse.id,
    title: dbCourse.title,
    description: dbCourse.description || "",
    videoId: dbCourse.video_id,
    youtubeUrl: dbCourse.youtube_url,
    thumbnail: dbCourse.thumbnail,
    isPublic: dbCourse.is_public,
    // Use standardized duration field
    duration_seconds: dbCourse.duration_seconds || 0,
    // Keep other duration fields for backward compatibility
    estimated_duration: dbCourse.estimated_duration,
    estimated_hours: dbCourse.estimated_hours,
    // Use standardized lesson count
    totalLessons: totalLessons,
    sections: sections,
    category: dbCourse.category,
    tags: dbCourse.tags || [],
    metadata: dbCourse.metadata || {},
    // Additional fields for UI
    progress: 0,
    rating: dbCourse.avg_rating,
    enrolledCount: dbCourse.enrollment_count || 0,
    // Store original course_items for backward compatibility
    courseItems: dbCourse.course_items || []
  };
}
