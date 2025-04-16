/**
 * Format view count into human readable format
 */
export function formatViews(viewCount: string | number): string {
  try {
    const count = typeof viewCount === 'string' ? parseInt(viewCount, 10) : viewCount;
    
    if (isNaN(count)) return '0';
    
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    } else {
      return count.toString();
    }
  } catch (error) {
    return '0';
  }
}

/**
 * Parse ISO 8601 duration string to human readable format
 */
export function formatDuration(isoDuration: string): string {
  try {
    // Remove the PT prefix from ISO duration
    const duration = isoDuration.replace('PT', '');
    
    // Extract hours, minutes, seconds
    const hours = duration.match(/(\d+)H/)?.at(1);
    const minutes = duration.match(/(\d+)M/)?.at(1);
    const seconds = duration.match(/(\d+)S/)?.at(1);
    
    // Build time parts array
    const parts: string[] = [];
    
    if (hours) {
      parts.push(`${hours}:${minutes?.padStart(2, '0') || '00'}`);
    }
    
    if (minutes && !hours) {
      parts.push(minutes);
    }
    
    parts.push(seconds?.padStart(2, '0') || '00');
    
    return parts.join(':');
  } catch (error) {
    return '00:00';
  }
}

/**
 * Format date string to relative time
 */
export function formatRelativeTime(date: string | number | Date): string {
  try {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000); // Difference in seconds
    
    if (diff < 60) {
      return 'just now';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else if (diff < 2592000) {
      const days = Math.floor(diff / 86400);
      return `${days} day${days === 1 ? '' : 's'} ago`;
    } else if (diff < 31536000) {
      const months = Math.floor(diff / 2592000);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      const years = Math.floor(diff / 31536000);
      return `${years} year${years === 1 ? '' : 's'} ago`;
    }
  } catch (error) {
    return '';
  }
}
