"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Download, Save } from "lucide-react"
import { toast } from "@/components/custom-toast"

interface NoteEditorProps {
  value: string
  onChange: (value: string) => void
  lessonId: string
}

export function NoteEditor({ value, onChange, lessonId }: NoteEditorProps) {
  const [isSaving, setIsSaving] = useState(false)

  // Handle saving notes
  const handleSave = () => {
    setIsSaving(true)
    
    try {
      // Save to localStorage
      localStorage.setItem(`note-${lessonId}`, value)
      
      // In a real app, you would save to the database here
      // For now, we'll just simulate a delay
      setTimeout(() => {
        setIsSaving(false)
        toast.success("Notes saved successfully")
      }, 500)
    } catch (error) {
      console.error("Error saving notes:", error)
      setIsSaving(false)
      toast.error("Failed to save notes")
    }
  }

  // Handle copying notes to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    toast.success("Notes copied to clipboard")
  }

  // Handle downloading notes
  const handleDownload = () => {
    const blob = new Blob([value], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notes-${lessonId || 'lesson'}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Notes downloaded")
  }

  return (
    <div className="border rounded-md p-4 min-h-[400px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Your Notes</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-3.5 w-3.5 mr-1" />
            Download
          </Button>
          <Button variant="default" size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="h-3.5 w-3.5 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      
      <textarea
        className="flex-1 outline-none resize-none bg-transparent p-2 border rounded-md"
        placeholder="Add your notes for this lesson here..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      
      <div className="mt-4 text-xs text-muted-foreground">
        <p>Notes are saved automatically when you navigate to another lesson.</p>
        <p>You can also manually save your notes by clicking the Save button.</p>
      </div>
    </div>
  )
}
