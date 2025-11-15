"use client"

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseAutoSaveOptions<T> {
  data: T
  onSave: (data: T) => Promise<void>
  interval?: number
  debounce?: number
  saveOnUnmount?: boolean
}

export function useAutoSave<T>({
  data,
  onSave,
  interval = 30000, // Auto-save every 30 seconds by default
  debounce = 1000,   // Debounce typing by 1 second
  saveOnUnmount = true
}: UseAutoSaveOptions<T>) {
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  // Use refs to keep track of the latest values without triggering effects
  const dataRef = useRef(data)
  const hasUnsavedChanges = useRef(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const intervalTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Update the ref when data changes
  useEffect(() => {
    // If data has changed, mark that we have unsaved changes
    if (JSON.stringify(dataRef.current) !== JSON.stringify(data)) {
      hasUnsavedChanges.current = true
      dataRef.current = data
    }
  }, [data])
  
  // Function to perform the save operation
  const saveData = useCallback(async () => {
    // Only save if there are unsaved changes
    if (!hasUnsavedChanges.current) return
    
    try {
      setIsSaving(true)
      setError(null)
      
      await onSave(dataRef.current)
      
      hasUnsavedChanges.current = false
      setLastSaved(new Date())
    } catch (err) {
      console.error('Auto-save error:', err)
      setError(err instanceof Error ? err : new Error('Failed to save'))
    } finally {
      setIsSaving(false)
    }
  }, [onSave])
  
  // Set up debounced save when data changes
  useEffect(() => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    
    // Set a new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (hasUnsavedChanges.current) {
        saveData()
      }
    }, debounce)
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [data, debounce, saveData])
  
  // Set up interval timer for periodic saves
  useEffect(() => {
    // Set up interval timer
    intervalTimerRef.current = setInterval(() => {
      if (hasUnsavedChanges.current) {
        saveData()
      }
    }, interval)
    
    return () => {
      if (intervalTimerRef.current) {
        clearInterval(intervalTimerRef.current)
      }
    }
  }, [interval, saveData])
  
  // Save on unmount if needed
  useEffect(() => {
    return () => {
      if (saveOnUnmount && hasUnsavedChanges.current) {
        saveData()
      }
    }
  }, [saveOnUnmount, saveData])
  
  // Function to manually trigger a save
  const save = useCallback(async () => {
    await saveData()
  }, [saveData])
  
  return {
    isSaving,
    lastSaved,
    error,
    save,
    hasUnsavedChanges: hasUnsavedChanges.current
  }
}
