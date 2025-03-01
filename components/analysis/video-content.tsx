"use client"

export function VideoContent() {
  return (
    <div className="space-y-4 px-6">
      <h3 className="text-lg font-medium">Video Content</h3>
      <p>This content appears in a bottom sheet on mobile.</p>
      <div className="bg-muted p-4 rounded-lg">
        Video player placeholder
      </div>
      <div className="space-y-2">
        <p>Additional video analysis content</p>
        <div className="bg-muted rounded h-32 flex items-center justify-center">
          More content
        </div>
      </div>
    </div>
  )
}
