"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@radix-ui/react-label"
import { Loader2 } from "lucide-react"

interface CourseGenerationModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CourseGenerationModal({
  isOpen,
  onClose
}: CourseGenerationModalProps) {
  const [url, setUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async () => {
    if (!url) return
    
    try {
      setIsLoading(true)
      // Generation logic will be implemented here
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulated delay
    } catch (error) {
      console.error("Error generating course:", error)
    } finally {
      setIsLoading(false)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Course from Video</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>YouTube Video URL</Label>
            <Input
              placeholder="Enter YouTube video URL"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={handleGenerate}
            disabled={!url || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Course"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
