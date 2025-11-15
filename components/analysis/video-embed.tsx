'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import type { YouTubeEvent, YouTubePlayerVars } from '@/types/youtube-iframe';

interface VideoEmbedProps {
  videoId: string;
  startTime?: number;
  endTime?: number;
  title?: string;
  autoPlay?: boolean;
  onReady?: () => void;
  onEnd?: () => void;
  className?: string;
  playerVars?: Partial<YouTubePlayerVars>;
}

export function VideoEmbed({
  videoId,
  startTime,
  endTime,
  title,
  autoPlay = false,
  onReady,
  onEnd,
  className,
  playerVars: customPlayerVars
}: VideoEmbedProps) {
  const [isLoading, setIsLoading] = useState(true);
  const playerId = `youtube-player-${videoId}`;

  const handlePlayerReady = useCallback((event: YouTubeEvent) => {
    setIsLoading(false);
    onReady?.();
  }, [onReady]);

  const handleStateChange = useCallback((event: YouTubeEvent) => {
    if (window.YT && event.data === window.YT.PlayerState.ENDED) {
      onEnd?.();
    }
  }, [onEnd]);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScript = document.getElementsByTagName('script')[0];
      firstScript?.parentNode?.insertBefore(tag, firstScript);
    }

    // Default player variables
    const defaultPlayerVars: YouTubePlayerVars = {
      start: startTime || 0,
      end: endTime,
      autoplay: autoPlay ? 1 : 0,
      modestbranding: 1,
      rel: 0,
      controls: 1,
      iv_load_policy: 3,
      playsinline: 1,
      enablejsapi: 1,
      origin: window.location.origin
    };

    // Initialize player when API is ready
    const initPlayer = () => {
      if (!window.YT) return;

      new window.YT.Player(playerId, {
        videoId,
        playerVars: {
          ...defaultPlayerVars,
          ...customPlayerVars
        },
        events: {
          onReady: handlePlayerReady,
          onStateChange: handleStateChange
        }
      });
    };

    // Initialize player or wait for API
    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    // Cleanup
    return () => {
      delete window.onYouTubeIframeAPIReady;
    };
  }, [
    videoId,
    startTime,
    endTime,
    autoPlay,
    handlePlayerReady,
    handleStateChange,
    playerId,
    customPlayerVars
  ]);

  return (
    <Card className={className}>
      {title && (
        <div className="p-4 border-b bg-muted/50">
          <h3 className="text-lg font-medium truncate">{title}</h3>
        </div>
      )}
      <div className="relative aspect-video">
        {isLoading && (
          <div className="absolute inset-0 z-10">
            <Skeleton className="w-full h-full" />
          </div>
        )}
        <div 
          id={playerId} 
          className="w-full h-full"
          data-loading={isLoading}
        />
      </div>
    </Card>
  );
}