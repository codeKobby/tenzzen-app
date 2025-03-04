import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Handle specific YouTube API error codes
    if (error.message.includes('quota')) {
      return "YouTube API quota exceeded. Please try again later."
    }
    
    if (error.message.includes('404') || error.message.includes('not found')) {
      return "Content not found on YouTube."
    }
    
    return error.message
  }
  return "An unknown error occurred"
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
