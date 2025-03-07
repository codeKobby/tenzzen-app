import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

// Safe way to open URLs that works in different environments
export function startUrl(url: string, target: string = '_blank', features: string = '') {
  // Check if window is available (client-side)
  if (typeof window !== 'undefined' && window.open) {
    window.open(url, target, features)
    return true
  }
  return false
}
