import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function startUrl(url: string, target?: string, features?: string): Window | null {
  return window.open(url, target, features) || null;
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
