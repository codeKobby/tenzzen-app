"use client"

import { useState, useEffect, useTransition } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = () => {
    // Prevent build error "window is undefined" but keep working
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);
  const [isPending, startTransition] = useTransition();

  const setValue = (value: T | ((val: T) => T)) => {
    if (isPending) return;

    startTransition(() => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        
        // Update state first
        setStoredValue(valueToStore);
        
        // Then update localStorage
        if (typeof window !== 'undefined') {
          queueMicrotask(() => {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          });
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    });
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        startTransition(() => {
          try {
            setStoredValue(JSON.parse(e.newValue!));
          } catch (error) {
            console.warn(`Error parsing storage value for key "${key}":`, error);
          }
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue] as const;
}
