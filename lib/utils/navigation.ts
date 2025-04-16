'use client';

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
