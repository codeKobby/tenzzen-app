"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ChevronLeft, Star, Edit, Trash2, Share2, Save, Clock } from "lucide-react"
import { RichTextEditor } from "@/components/rich-text-editor"
import { Note } from "@/types/notes"
import { format } from "date-fns"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@clerk/nextjs"

export default function NoteDetailPage() {
  const params = useParams()
  const noteId = typeof params.noteId === 'string' ? params.noteId : ''
  const router = useRouter()
  const { isSignedIn } = useAuth()
  
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState('')
  const [editedTags, setEditedTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Auto-save timer
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Fetch note data
  useEffect(() => {
    async function fetchNote() {
      if (!isSignedIn) {
        router.push('/sign-in')
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/notes/${noteId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/library')
            toast.error('Note not found')
            return
          }
          
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch note')
        }
        
        const data = await response.json()
        setNote(data)
        setEditedTitle(data.title)
        setEditedContent(data.content)
        setEditedTags(data.tags || [])
      } catch (err) {
        console.error('Error fetching note:', err)
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        toast.error('Failed to load note')
      } finally {
        setLoading(false)
      }
    }
    
    fetchNote()
  }, [noteId, router, isSignedIn])
  
  // Handle toggling star status
  const handleToggleStar = async () => {
    if (!note) return
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ starred: !note.starred }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update note')
      }
      
      const updatedNote = await response.json()
      setNote(updatedNote)
      
      toast.success(updatedNote.starred ? 'Note starred' : 'Note unstarred')
    } catch (err) {
      console.error('Error toggling star:', err)
      toast.error('Failed to update note')
    }
  }
  
  // Handle saving note changes
  const handleSaveChanges = async () => {
    if (!note) return
    
    try {
      setIsSaving(true)
      
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          tags: editedTags,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update note')
      }
      
      const updatedNote = await response.json()
      setNote(updatedNote)
      setLastSaved(new Date())
      
      if (!isEditing) {
        toast.success('Note updated successfully')
      }
    } catch (err) {
      console.error('Error updating note:', err)
      toast.error('Failed to update note')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Handle deleting note
  const handleDeleteNote = async () => {
    if (!note) return
    
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete note')
      }
      
      toast.success('Note deleted successfully')
      router.push('/library')
    } catch (err) {
      console.error('Error deleting note:', err)
      toast.error('Failed to delete note')
    }
  }
  
  // Handle sharing note (placeholder)
  const handleShareNote = () => {
    // In a real implementation, this would generate a shareable link or open a sharing dialog
    toast.info('Sharing functionality coming soon')
  }
  
  // Set up auto-save when editing
  useEffect(() => {
    if (isEditing) {
      // Clear any existing timer
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
      
      // Set a new timer to save changes after 2 seconds of inactivity
      const timer = setTimeout(() => {
        handleSaveChanges()
      }, 2000)
      
      setAutoSaveTimer(timer)
    }
    
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [editedTitle, editedContent, editedTags, isEditing])
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer)
      }
    }
  }, [])
  
  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => router.push('/library')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Library
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-2/3 mb-2" />
            <div className="flex gap-2 mb-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-5/6 mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Error state
  if (error || !note) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="mr-2"
            onClick={() => router.push('/library')}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Library
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h2 className="text-xl font-bold mb-2">Error Loading Note</h2>
            <p className="text-muted-foreground mb-4">
              {error || 'Note not found or could not be loaded.'}
            </p>
            <Button onClick={() => router.push('/library')}>
              Return to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/library')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Back to Library
        </Button>
        
        <div className="flex items-center gap-2">
          {lastSaved && (
            <div className="flex items-center text-sm text-muted-foreground mr-2">
              <Clock className="h-3 w-3 mr-1" />
              Last saved: {format(lastSaved, 'h:mm a')}
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleStar}
            className={note.starred ? "text-yellow-500" : ""}
          >
            <Star className="h-4 w-4 mr-1" fill={note.starred ? "currentColor" : "none"} />
            {note.starred ? "Starred" : "Star"}
          </Button>
          
          {isEditing ? (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                handleSaveChanges()
                setIsEditing(false)
              }}
            >
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleShareNote}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
          
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your note.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="text-xl font-bold"
            />
          ) : (
            <CardTitle className="text-xl">{note.title}</CardTitle>
          )}
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge variant="outline" className="bg-muted/50">
              {note.category === 'course' ? 'Course Notes' : 
               note.category === 'code' ? 'Code Snippet' : 'Personal Note'}
            </Badge>
            
            {note.course && (
              <Badge variant="secondary">
                {note.course}
              </Badge>
            )}
            
            {isEditing ? (
              <div className="w-full mt-2">
                <Label htmlFor="tags" className="text-sm">Tags</Label>
                <Input
                  id="tags"
                  value={editedTags.join(', ')}
                  onChange={(e) => setEditedTags(e.target.value.split(',').map(tag => tag.trim()))}
                  placeholder="Enter tags separated by commas"
                  className="mt-1"
                />
              </div>
            ) : (
              note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-primary/10">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )
            )}
          </div>
          
          <div className="text-sm text-muted-foreground mt-2">
            Created: {format(new Date(note.createdAt), 'MMM d, yyyy')}
            {note.createdAt !== note.updatedAt && (
              <> · Updated: {format(new Date(note.updatedAt), 'MMM d, yyyy')}</>
            )}
          </div>
        </CardHeader>
        
        <Separator className="mb-4" />
        
        <CardContent>
          {isEditing ? (
            <RichTextEditor
              content={editedContent}
              onChange={setEditedContent}
              minHeight="400px"
            />
          ) : (
            <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: note.content }} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
