'use client';

import { useTopLoader } from 'nextjs-toploader';

let previousPath: string | null = null;

export function setPreviousPath(path: string) {
  previousPath = path;
}

export function getPreviousPath(): string | null {
  return previousPath;
}

export function clearPreviousPath() {
  previousPath = null;
}

export function getNavigateBackPath(): string {
  return previousPath || '/';
}

/**
 * Manually start the top loader
 * This can be used in places where the loader doesn't automatically trigger
 */
export function startTopLoader() {
  // This is a safe way to access the loader outside of a React component
  if (typeof window !== 'undefined') {
    // Create a custom event to trigger the loader
    const event = new CustomEvent('start-top-loader');
    window.dispatchEvent(event);
  }
}

/**
 * Manually complete the top loader
 * This can be used to finish the loader after a manual start
 */
export function completeTopLoader() {
  // This is a safe way to access the loader outside of a React component
  if (typeof window !== 'undefined') {
    // Create a custom event to complete the loader
    const event = new CustomEvent('complete-top-loader');
    window.dispatchEvent(event);
  }
}

/**
 * Hook to listen for custom top loader events
 * This should be used in a component near the root of the application
 */
export function useTopLoaderEvents() {
  const loader = useTopLoader();

  if (typeof window !== 'undefined') {
    // Listen for custom events to start and complete the loader
    window.addEventListener('start-top-loader', () => {
      loader.start();
    });

    window.addEventListener('complete-top-loader', () => {
      loader.done();
    });

    // Clean up event listeners
    return () => {
      window.removeEventListener('start-top-loader', () => {
        loader.start();
      });
      window.removeEventListener('complete-top-loader', () => {
        loader.done();
      });
    };
  }

  return null;
}
