'use client';

import * as React from "react"
import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { VideoDetails, PlaylistDetails, ContentDetails } from "@/types/youtube"

// Define the context shape
interface AnalysisContextType {
  width: number
  minWidth: number
  maxWidth: number
  isOpen: boolean
  showAlert: boolean
  videoData: ContentDetails | null
  courseData: any | null
  showCoursePanel: boolean
  setWidth: (width: number) => void
  toggle: (open?: boolean) => void
  setShowAlert: (show: boolean) => void
  confirmBack: () => void
  setVideoData: (data: ContentDetails | null) => void
  setCourseData: (data: any | null) => void
  setShowCoursePanel: (show: boolean) => void
  removedVideoIds: Record<string, boolean>
  removeVideo: (videoId: string) => void
  restoreVideo: (videoId: string) => void
}

const initialState = {
  width: 350,
  minWidth: 300,
  maxWidth: 600,
  isOpen: false,
  showAlert: false,
}

// Create context with default values
const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined)

// Provider component
export function AnalysisProvider({
  children,
  initialContent,
}: {
  children: React.ReactNode;
  initialContent?: ContentDetails | null;
}) {
  const router = useRouter()
  const [width, setWidth] = useState(initialState.width)
  const [isOpen, setIsOpen] = useState(initialState.isOpen)
  const [showAlert, setShowAlert] = useState(initialState.showAlert)
  const [videoData, setVideoData] = useState<ContentDetails | null>(initialContent || null)
  const [courseData, setCourseData] = useState<any | null>(null)
  const [showCoursePanel, setShowCoursePanel] = useState(false)
  const [removedVideoIds, setRemovedVideoIds] = useState<Record<string, boolean>>({})

  // Make sure toggle has stable behavior
  const toggle = useCallback((value?: boolean) => {
    if (value !== undefined) {
      setIsOpen(value);
    } else {
      setIsOpen(prev => !prev);
    }
  }, []);

  const removeVideo = useCallback((videoId: string) => {
    setRemovedVideoIds(prev => ({ ...prev, [videoId]: true }))
  }, [])

  const restoreVideo = useCallback((videoId: string) => {
    setRemovedVideoIds(prev => {
      const newRemoved = { ...prev }
      delete newRemoved[videoId]
      return newRemoved
    })
  }, [])

  const confirmBack = useCallback(() => {
    setShowAlert(false)
    router.back()
  }, [router])

  // For debugging
  React.useEffect(() => {
    if (initialContent) {
      console.log("Setting initial content in provider:", {
        type: initialContent.type,
        id: initialContent.id,
        title: initialContent.title
      });
    }
  }, [initialContent]);

  const context = {
    width,
    minWidth: initialState.minWidth,
    maxWidth: initialState.maxWidth,
    isOpen,
    videoData,
    courseData,
    showCoursePanel,
    showAlert,
    setWidth,
    toggle,
    setShowAlert,
    setVideoData,
    setCourseData,
    setShowCoursePanel,
    confirmBack,
    removedVideoIds,
    removeVideo,
    restoreVideo,
  }

  return (
    <AnalysisContext.Provider value={context}>
      {children}
    </AnalysisContext.Provider>
  )
}

// Hook to use the context
export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}