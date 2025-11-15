export interface YouTubeEvent {
  data: number;
  target: YT.Player;
}

export interface YouTubePlayerVars {
  autoplay?: 0 | 1;
  cc_lang_pref?: string;
  cc_load_policy?: 0 | 1;
  color?: 'red' | 'white';
  controls?: 0 | 1;
  disablekb?: 0 | 1;
  enablejsapi?: 0 | 1;
  end?: number;
  fs?: 0 | 1;
  hl?: string;
  iv_load_policy?: 1 | 3;
  list?: string;
  listType?: 'playlist' | 'user_uploads';
  loop?: 0 | 1;
  modestbranding?: 0 | 1;
  origin?: string;
  playlist?: string;
  playsinline?: 0 | 1;
  rel?: 0 | 1;
  start?: number;
  widget_referrer?: string;
}

export interface YouTubePlayer {
  videoId: string;
  playerVars?: YouTubePlayerVars;
  events?: {
    onReady?: (event: YouTubeEvent) => void;
    onStateChange?: (event: YouTubeEvent) => void;
    onError?: (event: YouTubeEvent) => void;
    onPlaybackQualityChange?: (event: YouTubeEvent) => void;
    onPlaybackRateChange?: (event: YouTubeEvent) => void;
    onApiChange?: (event: YouTubeEvent) => void;
  };
  width?: string | number;
  height?: string | number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: string | HTMLElement,
        config: YouTubePlayer
      ) => void;
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