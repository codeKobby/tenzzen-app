"use client"

import * as React from "react"
import { PageHeader } from "@/components/page-header"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { ResizablePanel } from "@/components/resizable-panel"
import { useAnalysisPanel } from "@/hooks/use-analysis-panel"

export default function AnalysisPage() {
  const { width, minWidth, maxWidth, isOpen, setWidth, toggle } = useAnalysisPanel()

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      <PageHeader />
      
      <main className="flex-1 relative">
        <div className="flex h-[calc(100vh-64px)]">
          {/* Left panel - converts to bottom sheet on small screens */}
          <div className="hidden sm:block relative border-r bg-background">
            <ResizablePanel
              defaultWidth={width}
              minWidth={minWidth}
              maxWidth={maxWidth}
              onWidthChange={setWidth}
              className="h-full"
            >
              <div className="h-full p-6">
                {/* Video content will go here */}
                Video content
              </div>
            </ResizablePanel>
          </div>

          {/* Bottom sheet for small screens */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40">
            <Sheet open={isOpen} onOpenChange={toggle}>
              <SheetContent
                side="bottom"
                className="h-[80vh] p-0"
              >
                <div className="h-full p-6">
                  {/* Video content will go here */}
                  Video content
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            <div className="p-6">
              {/* Main content will go here */}
              <div className="h-[200vh]">Temporary content for scrolling test</div>
            </div>
          </div>
        </div>
      </main>

    </div>
  )
}
