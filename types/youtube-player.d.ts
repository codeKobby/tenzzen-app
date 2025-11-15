export interface YouTubeEvent {
  data: number;
  target: YT.Player;
}

export interface PlayerVars {
  autoplay?: 0 | 1;
  controls?: 0 | 1;
  modestbranding?: 0 | 1;
  rel?: 0 | 1;
  start?: number;
  end?: number;
  enablejsapi?: 0 | 1;
  origin?: string;
  playsinline?: 0 | 1;
  iv_load_policy?: 1 | 3;
}

export interface PlayerConfig {
  videoId: string;
  playerVars?: PlayerVars;
  events?: {
    onReady?: (event: YouTubeEvent) => void;
    onStateChange?: (event: YouTubeEvent) => void;
    onError?: (event: YouTubeEvent) => void;
  };
}

declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string, config: PlayerConfig) => void;
      PlayerState: {
        UNSTARTED: -1;
        ENDED: 0;
        PLAYING: 1;
        PAUSED: 2;
        BUFFERING: 3;
        CUED: 5;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export {};