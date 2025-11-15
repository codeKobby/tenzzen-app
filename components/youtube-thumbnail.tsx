'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface YouTubeThumbnailProps {
  videoId: string;
  width?: number;
  height?: number;
  className?: string;
  alt?: string;
  priority?: boolean;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * A component for displaying YouTube thumbnails with fallback options
 * Uses the image proxy API to prevent timeout issues
 */
export function YouTubeThumbnail({
  videoId,
  width = 1280,
  height = 720,
  className,
  alt = "YouTube video thumbnail",
  priority = false,
  quality = 80,
  onLoad,
  onError,
}: YouTubeThumbnailProps) {
  // Start with the highest quality thumbnail
  const [thumbnailQuality, setThumbnailQuality] = useState<'maxresdefault' | 'hqdefault' | 'mqdefault' | 'sddefault'>('maxresdefault');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Create the thumbnail URL with our proxy
  // Use direct YouTube URL for better reliability
  const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/${thumbnailQuality}.jpg`;

  // Handle thumbnail loading error by trying a lower quality
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);

    // Try fallback thumbnails in order of quality
    if (thumbnailQuality === 'maxresdefault') {
      setThumbnailQuality('sddefault');
    } else if (thumbnailQuality === 'sddefault') {
      setThumbnailQuality('hqdefault');
    } else if (thumbnailQuality === 'hqdefault') {
      setThumbnailQuality('mqdefault');
    } else {
      // If we've tried all qualities and still have an error
      if (onError) onError();
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    if (onLoad) onLoad();
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Show a placeholder while loading */}
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      <Image
        src={thumbnailUrl}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100"
        )}
        priority={priority}
        quality={quality}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Show a fallback if all thumbnail qualities fail */}
      {hasError && thumbnailQuality === 'mqdefault' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-muted-foreground text-sm">Thumbnail unavailable</span>
        </div>
      )}
    </div>
  );
}
