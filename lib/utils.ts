import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an error into a user-friendly message
 */
export function formatErrorMessage(error: unknown): string {
  if (!error) return '';
  
  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }
  
  // Handle error as string
  if (typeof error === 'string') {
    return error;
  }
  
  // Handle error as object with message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message);
  }
  
  // Generic error
  return 'An unexpected error occurred';
}

/**
 * Format a number for display (e.g., 1200 -> 1.2K)
 */
export function formatCount(count: string | number): string {
  const num = typeof count === 'string' ? parseInt(count, 10) : count;
  
  if (isNaN(num)) return '0';
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  
  return num.toString();
}

/**
 * Format seconds to a time string (e.g., 125 -> 2:05)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Extract ID from various YouTube URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Handle youtu.be URLs
  if (url.includes('youtu.be/')) {
    const id = url.split('youtu.be/')[1]?.split(/[?&]/)[0];
    return id || null;
  }
  
  // Handle youtube.com URLs
  const videoMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (videoMatch && videoMatch[1]) {
    return videoMatch[1];
  }
  
  // Handle playlist URLs
  const playlistMatch = url.match(/[?&]list=([^&]+)/i);
  if (playlistMatch && playlistMatch[1]) {
    return playlistMatch[1];
  }
  
  // If it looks like a direct ID
  if (/^[A-Za-z0-9_-]{11}$/.test(url)) {
    return url;
  }
  
  if (/^[A-Za-z0-9_-]{13,}$/.test(url)) { // Playlist IDs are generally longer
    return url;
  }
  
  return null;
}

/**
 * Safely access nested object properties
 */
export function safeAccess(obj: any, path: string, defaultValue: any = undefined) {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result === null || result === undefined) return defaultValue;
      result = result[key];
    }
    
    return result === undefined ? defaultValue : result;
  } catch (e) {
    return defaultValue;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function addUnitIfNeeded(value: number | string, unit: string = 'px'): string {
  return typeof value === 'number' ? `${value}${unit}` : value;
}

// Format large numbers (like views, likes) with K, M, B suffixes
export function formatViews(viewsStr: string | number | undefined | null): string {
  try {
    const views = Number(viewsStr); // Convert input to number
    if (isNaN(views)) return "0"; // Handle non-numeric input

    if (views >= 1_000_000_000) {
      return `${(views / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}B`;
    } else if (views >= 1_000_000) {
      return `${(views / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    } else if (views >= 1_000) {
      return `${(views / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
    } else {
      return String(views);
    }
  } catch (error) {
    console.error("Error formatting views:", error);
    return "0"; // Fallback on error
  }
}

// Format seconds into MM:SS or HH:MM:SS
export function formatTimestamp(totalSeconds: number | undefined | null): string {
  if (totalSeconds === undefined || totalSeconds === null || isNaN(totalSeconds) || totalSeconds < 0) {
    return "00:00";
  }

  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);

  const paddedSeconds = seconds.toString().padStart(2, '0');
  const paddedMinutes = minutes.toString().padStart(2, '0');

  if (hours > 0) {
    const paddedHours = hours.toString().padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
  }

  return `${paddedMinutes}:${paddedSeconds}`;
}

/**
 * Validates if a string is a valid UUID v4 format
 * @param uuid The string to validate
 * @returns boolean indicating if the string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validates if a string is a valid Convex ID
 * Convex IDs are base32-encoded strings
 */
export function isValidConvexId(id: string): boolean {
  if (!id || typeof id !== 'string') return false;
  // Convex IDs are typically 32 characters, alphanumeric lowercase
  return /^[a-z0-9]{20,}$/.test(id);
}

/**
 * Validates if a string is a valid course ID
 * Checks that it's not a user ID and is a valid Convex ID
 * @param id The ID to validate
 * @returns An object with validation result and error message if invalid
 */
export function validateCourseId(id: string): { isValid: boolean; error?: string } {
  if (!id) {
    return { isValid: false, error: 'Missing course ID' };
  }

  if (id.startsWith('user_')) {
    return {
      isValid: false,
      error: `Invalid course ID: This appears to be a user ID (${id}), not a course ID.`
    };
  }

  if (!isValidConvexId(id)) {
    return {
      isValid: false,
      error: `Invalid course ID format: Expected a valid Convex ID, got ${id}.`
    };
  }

  return { isValid: true };
}
