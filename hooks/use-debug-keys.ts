import { useEffect } from 'react';
import { useAnalysis } from './use-analysis-context';

const DEBUG_KEYS = {
  TOGGLE_PANEL: 'p',
  GENERATE_COURSE: 'g',
  CANCEL_GENERATION: 'c',
  RESET_STATE: 'r',
  TOGGLE_DEBUG: 'd'
} as const;

interface UseDebugKeysOptions {
  enabled?: boolean;
  onToggleDebug?: () => void;
}

export function useDebugKeys({ enabled = true, onToggleDebug }: UseDebugKeysOptions = {}) {
  const {
    toggle,
    generateCourse,
    cancelGeneration,
    courseGenerating,
    isOpen
  } = useAnalysis();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if Command/Control is pressed
      if (!event.ctrlKey && !event.metaKey) return;

      switch (event.key.toLowerCase()) {
        case DEBUG_KEYS.TOGGLE_PANEL:
          event.preventDefault();
          toggle();
          break;

        case DEBUG_KEYS.GENERATE_COURSE:
          if (!courseGenerating && isOpen) {
            event.preventDefault();
            generateCourse();
          }
          break;

        case DEBUG_KEYS.CANCEL_GENERATION:
          if (courseGenerating) {
            event.preventDefault();
            cancelGeneration();
          }
          break;

        case DEBUG_KEYS.RESET_STATE:
          event.preventDefault();
          localStorage.clear();
          window.location.reload();
          break;

        case DEBUG_KEYS.TOGGLE_DEBUG:
          event.preventDefault();
          onToggleDebug?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    toggle,
    generateCourse,
    cancelGeneration,
    courseGenerating,
    isOpen,
    onToggleDebug
  ]);
}

// Export shortcut information for UI display
export const SHORTCUTS = [
  { key: `⌘/${process.platform === 'darwin' ? '⌃' : 'Ctrl'}+${DEBUG_KEYS.TOGGLE_PANEL}`, description: 'Toggle Panel' },
  { key: `⌘/${process.platform === 'darwin' ? '⌃' : 'Ctrl'}+${DEBUG_KEYS.GENERATE_COURSE}`, description: 'Generate Course' },
  { key: `⌘/${process.platform === 'darwin' ? '⌃' : 'Ctrl'}+${DEBUG_KEYS.CANCEL_GENERATION}`, description: 'Cancel Generation' },
  { key: `⌘/${process.platform === 'darwin' ? '⌃' : 'Ctrl'}+${DEBUG_KEYS.RESET_STATE}`, description: 'Reset State' },
  { key: `⌘/${process.platform === 'darwin' ? '⌃' : 'Ctrl'}+${DEBUG_KEYS.TOGGLE_DEBUG}`, description: 'Toggle Debug Panel' },
] as const;