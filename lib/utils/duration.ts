/**
 * Utility functions for handling course duration formatting
 */

/**
 * Format seconds into YouTube-style duration (MM:SS or HH:MM:SS)
 * @param seconds Total duration in seconds
 * @returns Formatted duration string
 */
export function formatDurationFromSeconds(seconds: number): string {
  // Ensure seconds is a valid number
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    seconds = 0;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  // Format with leading zeros
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

  // If hours > 0, show hours:minutes:seconds format (H:MM:SS)
  if (hours > 0) {
    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  }

  // Otherwise show minutes:seconds format (MM:SS)
  return `${minutes}:${formattedSeconds}`;
}

/**
 * Parse duration string to seconds
 * @param duration Duration string in various formats
 * @returns Total seconds
 */
export function parseDurationToSeconds(duration: string | number | undefined): number {
  if (duration === undefined) {
    return 0;
  }

  // If already a number, assume it's seconds
  if (typeof duration === 'number') {
    return duration;
  }

  // If string with 'h' or 'm', parse it (e.g., "1h 30m")
  if (typeof duration === 'string') {
    if (duration.includes('h') || duration.includes('m')) {
      // Parse hours
      const hoursMatch = duration.match(/(\d+)h/);
      const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;

      // Parse minutes
      const minutesMatch = duration.match(/(\d+)m/);
      const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;

      // Convert to seconds
      return (hours * 3600) + (minutes * 60);
    } 
    
    // If it's a time format with colons (e.g., "1:30:45")
    if (duration.includes(':')) {
      const parts = duration.split(':');
      
      if (parts.length === 3) {
        // HH:MM:SS format
        const hours = parseInt(parts[0], 10) || 0;
        const minutes = parseInt(parts[1], 10) || 0;
        const seconds = parseInt(parts[2], 10) || 0;
        return (hours * 3600) + (minutes * 60) + seconds;
      } else if (parts.length === 2) {
        // MM:SS format
        const minutes = parseInt(parts[0], 10) || 0;
        const seconds = parseInt(parts[1], 10) || 0;
        return (minutes * 60) + seconds;
      }
    }
    
    // If it's a numeric string, parse it as seconds
    if (!isNaN(parseFloat(duration))) {
      return parseFloat(duration);
    }
  }

  // Default fallback
  return 0;
}

/**
 * Format hours and minutes into a human-readable string (e.g., "1h 30m")
 * @param seconds Total duration in seconds
 * @returns Formatted duration string
 */
export function formatDurationHumanReadable(seconds: number): string {
  // Ensure seconds is a valid number
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    seconds = 0;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return "< 1m"; // Less than a minute
  }
}

/**
 * Calculate total duration in seconds from course sections and lessons
 * @param sections Array of course sections with lessons
 * @returns Total duration in seconds
 */
export function calculateTotalDurationFromSections(sections: any[]): number {
  if (!Array.isArray(sections)) {
    return 0;
  }

  return sections.reduce((total, section) => {
    // Add section duration if it's a number
    if (typeof section.duration === 'number') {
      return total + section.duration;
    }

    // Or add up lesson durations
    const sectionSeconds = Array.isArray(section.lessons) 
      ? section.lessons.reduce((acc, lesson) => {
          // Add lesson duration if available
          if (typeof lesson.duration === 'number') {
            return acc + lesson.duration;
          }
          return acc;
        }, 0)
      : 0;

    return total + sectionSeconds;
  }, 0);
}
