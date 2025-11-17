"use client"

import { useState, useEffect, useCallback } from 'react'
import { Note, CreateNoteInput, UpdateNoteInput, CategoryFilter, SortOption } from '@/types/notes'
import { toast } from 'sonner'

interface UseNotesOptions {
  initialFilter?: CategoryFilter
  initialSort?: SortOption
  initialSearch?: string
  courseId?: string
  lessonId?: string
  autoRefresh?: boolean
}

export function useNotes({
  initialFilter = 'all',
  initialSort = 'recent',
  initialSearch = '',
  courseId,
  lessonId,
  autoRefresh = false,
}: UseNotesOptions = {}) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<CategoryFilter>(initialFilter)
  const [sort, setSort] = useState<SortOption>(initialSort)
  const [search, setSearch] = useState(initialSearch)

  // Function to fetch all notes
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Notes API not yet implemented - return empty array
      console.warn('Notes API not yet implemented')
      setNotes([])
      return
      
      // Build query parameters
      const params = new URLSearchParams()
      if (filter !== 'all') {
        if (filter === 'starred') {
          params.append('starred', 'true')
        } else {
          params.append('category', filter)
        }
      }
      if (courseId) {
        params.append('courseId', courseId)
      }
      if (lessonId) {
        params.append('lessonId', lessonId)
      }
      if (search) {
        params.append('search', search)
      }

      // Fetch notes from API
      const response = await fetch(`/api/notes?${params.toString()}`)
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : { error: `Server error: ${response.status}` }
        throw new Error(errorData.error || 'Failed to fetch notes')
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response')
      }
      const data = await response.json()
      
      // Sort notes based on sort option
      let sortedNotes = [...data]
      if (sort === 'recent') {
        sortedNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      } else if (sort === 'oldest') {
        sortedNotes.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      } else if (sort === 'alphabetical') {
        sortedNotes.sort((a, b) => a.title.localeCompare(b.title))
      } else if (sort === 'category') {
        sortedNotes.sort((a, b) => a.category.localeCompare(b.category))
      }
      
      setNotes(sortedNotes)
    } catch (err) {
      console.error('Error fetching notes:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      toast.error('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [filter, sort, search, courseId, lessonId])

  // Function to fetch a single note by ID
  const fetchNote = useCallback(async (id: string): Promise<Note | null> => {
    try {
      const response = await fetch(`/api/notes/${id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Note not found')
          return null
        }
        const contentType = response.headers.get('content-type')
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : { error: `Server error: ${response.status}` }
        throw new Error(errorData.error || 'Failed to fetch note')
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response')
      }
      return await response.json()
    } catch (err) {
      console.error(`Error fetching note ${id}:`, err)
      toast.error('Failed to load note')
      return null
    }
  }, [])

  // Function to create a new note
  const createNote = useCallback(async (input: CreateNoteInput): Promise<Note | null> => {
    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : { error: `Server error: ${response.status}` }
        throw new Error(errorData.error || 'Failed to create note')
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response')
      }
      const newNote = await response.json()
      
      // Update local state
      setNotes(prev => [newNote, ...prev])
      
      toast.success('Note created successfully')
      return newNote
    } catch (err) {
      console.error('Error creating note:', err)
      toast.error('Failed to create note')
      return null
    }
  }, [])

  // Function to update a note
  const updateNote = useCallback(async (input: UpdateNoteInput): Promise<Note | null> => {
    try {
      const { id, ...updateData } = input
      
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : { error: `Server error: ${response.status}` }
        throw new Error(errorData.error || 'Failed to update note')
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response')
      }
      const updatedNote = await response.json()
      
      // Update local state
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note))
      
      toast.success('Note updated successfully')
      return updatedNote
    } catch (err) {
      console.error('Error updating note:', err)
      toast.error('Failed to update note')
      return null
    }
  }, [])

  // Function to delete a note
  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : { error: `Server error: ${response.status}` }
        throw new Error(errorData.error || 'Failed to delete note')
      }
      
      // Update local state
      setNotes(prev => prev.filter(note => note.id !== id))
      
      toast.success('Note deleted successfully')
      return true
    } catch (err) {
      console.error('Error deleting note:', err)
      toast.error('Failed to delete note')
      return false
    }
  }, [])

  // Function to toggle star status
  const toggleStar = useCallback(async (id: string, starred: boolean): Promise<boolean> => {
    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ starred }),
      })
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type')
        const errorData = contentType?.includes('application/json')
          ? await response.json()
          : { error: `Server error: ${response.status}` }
        throw new Error(errorData.error || 'Failed to update note')
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        throw new Error('Server returned non-JSON response')
      }
      const updatedNote = await response.json()
      
      // Update local state
      setNotes(prev => prev.map(note => note.id === id ? updatedNote : note))
      
      toast.success(starred ? 'Note starred' : 'Note unstarred')
      return true
    } catch (err) {
      console.error('Error toggling star:', err)
      toast.error('Failed to update note')
      return false
    }
  }, [])

  // Fetch notes on mount and when dependencies change
  useEffect(() => {
    fetchNotes()
    
    // Set up auto-refresh interval if enabled
    let intervalId: NodeJS.Timeout | undefined
    if (autoRefresh) {
      intervalId = setInterval(fetchNotes, 30000) // Refresh every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [fetchNotes, autoRefresh])

  return {
    notes,
    loading,
    error,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    fetchNotes,
    fetchNote,
    createNote,
    updateNote,
    deleteNote,
    toggleStar,
  }
}
