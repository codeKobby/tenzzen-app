"use client"

import React, { useRef, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useAnalysis } from "@/hooks/use-analysis-context"
import { mockCourseData } from "@/lib/mock/course-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "../ui/button"
import {
  X, Play, Bookmark, GraduationCap, Clock, BookOpen, FileText, TestTube2,
  XCircle, Tag, ChevronDown, Lock, FileQuestion, Code, Briefcase, CheckCircle2,
  ArrowUp
} from "lucide-react"
import { YouTubeEmbed } from "@/components/youtube-embed"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"

interface CoursePanelProps {
  className?: string
}

// ... existing ActionButtons component ...

// ... existing CourseSummary component ...

// ... existing TabContent component ...

// ... existing ProgressBar component ...

export function CoursePanel({ className }: CoursePanelProps) {
  // ... existing state and hooks ...

  // Track scroll position within course panel
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Handle scrolling within the course panel section
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setShowScrollTop(scrollContainerRef.current.scrollTop > 300)
    }
  }

  // Scroll to top function for the course panel
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  // Add scroll event listener to the course panel container
  useEffect(() => {
    const currentRef = scrollContainerRef.current
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll)
      return () => currentRef.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // ... existing intersection observer for summary section ...

  if (!isVisible) {
    return null
  }

  // Use a fixed video ID for the course preview
  const coursePreviewVideoId = "W6NZfCO5SIk"

  return (
    <div
      className={cn(
        "bg-background flex flex-col w-full sm:w-full h-full overflow-hidden transition-all duration-300 ease-in-out",
        className
      )}
    >
      {/* ... existing code for loading state ... */}

      {/* ... existing code for error state ... */}

      {/* Course content with single scrollable container */}
      {courseData && !courseGenerating && !courseError && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* This is now the main scroll container for everything */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto hover:scrollbar scrollbar-thin"
            onScroll={handleScroll}
          >
            {/* Course preview and summary section */}
            <div className="p-4 border-b" ref={summaryRef}>
              {/* ... existing grid with YouTube embed and course summary ... */}
            </div>

            {/* Course tabs */}
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col"
            >
              {/* ... existing sticky tabs navigation ... */}

              {/* ... existing tabs content ... */}
            </Tabs>
          </div>

          {/* Section-specific scroll to top button */}
          {showScrollTop && (
            <Button
              variant="secondary"
              size="icon"
              onClick={scrollToTop}
              className="absolute bottom-6 right-6 h-10 w-10 rounded-full shadow-lg z-50 animate-in fade-in"
            >
              <ArrowUp className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
