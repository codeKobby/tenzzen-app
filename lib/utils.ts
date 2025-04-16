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
