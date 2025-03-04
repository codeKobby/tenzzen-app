"use client"

import { ReactNode, createContext, useContext, useState } from "react"
import { useRouter } from "next/navigation"
import type { ContentDetails } from "@/types/youtube"

interface AnalysisContextType {
  width: number
  minWidth: number
  maxWidth: number
  isOpen: boolean
  videoData: ContentDetails | null
  showAlert: boolean
  setWidth: (width: number) => void
  toggle: (value?: boolean) => void
  setShowAlert: (show: boolean) => void
  setVideoData: (data: ContentDetails | null) => void
  confirmBack: () => void
}

const initialState: AnalysisContextType = {
  width: 400,
  minWidth: 320,
  maxWidth: 480,
  isOpen: false,
  videoData: null,
  showAlert: false,
  setWidth: () => {},
  toggle: () => {},
  setShowAlert: () => {},
  setVideoData: () => {},
  confirmBack: () => {},
}

const AnalysisContext = createContext<AnalysisContextType>(initialState)

interface AnalysisProviderProps {
  children: ReactNode
}

export function AnalysisProvider({ children }: AnalysisProviderProps) {
  const router = useRouter()
  const [width, setWidth] = useState(initialState.width)
  const [isOpen, setIsOpen] = useState(initialState.isOpen)
  const [showAlert, setShowAlert] = useState(initialState.showAlert)
  const [videoData, setVideoData] = useState<ContentDetails | null>(null)

  const toggle = (value?: boolean) => {
    setIsOpen(prev => value ?? !prev)
  }

  const confirmBack = () => {
    setShowAlert(false)
    router.back()
  }

  return (
    <AnalysisContext.Provider
      value={{
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
      }}
    >
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
