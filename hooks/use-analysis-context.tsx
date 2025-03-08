"use client"

import * as React from "react"
import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { VideoDetails, PlaylistDetails, ContentDetails } from "@/types/youtube"

interface AnalysisContextType {
  width: number
  minWidth: number
  maxWidth: number
  isOpen: boolean
  showAlert: boolean
  videoData: ContentDetails | null
  setWidth: (width: number) => void
  toggle: (open?: boolean) => void
  setShowAlert: (show: boolean) => void
  confirmBack: () => void
  setVideoData: (data: ContentDetails | null) => void
}

const initialState: AnalysisContextType = {
  width: 400,
  minWidth: 320,
  maxWidth: 480,
  isOpen: false,
  videoData: null,
  showAlert: false,
  setWidth: () => { },
  toggle: () => { },
  setShowAlert: () => { },
  setVideoData: () => { },
  confirmBack: () => { },
}

const AnalysisContext = createContext<AnalysisContextType>(initialState)

interface AnalysisProviderProps {
  children: ReactNode;
  initialContent?: ContentDetails | null;
}

export function AnalysisProvider({
  children,
  initialContent
}: {
  children: React.ReactNode
  initialContent: ContentDetails | null
}) {
  const router = useRouter()
  const [width, setWidth] = useState(initialState.width)
  const [isOpen, setIsOpen] = useState(initialState.isOpen)
  const [showAlert, setShowAlert] = useState(initialState.showAlert)
  const [videoData, setVideoData] = useState<ContentDetails | null>(initialContent || null)
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
    setRemovedVideoIds(prev => ({
      ...prev,
      [videoId]: true
    }))
  }, [])

  const restoreVideo = useCallback((videoId: string) => {
    setRemovedVideoIds(prev => {
      const newRemoved = { ...prev }
      delete newRemoved[videoId]
      return newRemoved
    })
  }, [])

  const confirmBack = () => {
    setShowAlert(false)
    router.back()
  }

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
    showAlert,
    setWidth,
    toggle,
    setShowAlert,
    setVideoData,
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

export const useAnalysis = () => {
  const context = useContext(AnalysisContext)
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider")
  }
  return context
}
