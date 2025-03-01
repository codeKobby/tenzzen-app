"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

interface AnalysisContextType {
  width: number
  minWidth: number
  maxWidth: number
  isOpen: boolean
  showAlert: boolean
  setWidth: (width: number) => void
  toggle: (open?: boolean) => void
  handleBack: () => void
  confirmBack: () => void
  setShowAlert: (show: boolean) => void
}

const AnalysisContext = React.createContext<AnalysisContextType | undefined>(undefined)

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const [width, setWidth] = React.useState(320)
  const [showAlert, setShowAlert] = React.useState(false)
  const router = useRouter()

  // Use a ref for initial mount state to prevent flash
  const hasShownSheet = React.useRef(false)
  // Start with sheet closed by default
  const [isOpen, setIsOpen] = React.useState(false)

  // Handle initial mount and mobile detection
  React.useEffect(() => {
    let timer: NodeJS.Timeout
    const isMobile = window.matchMedia('(max-width: 640px)').matches

    if (isMobile && !hasShownSheet.current) {
      hasShownSheet.current = true
      // Slightly delay the initial open to ensure smooth animation
      timer = setTimeout(() => {
        setIsOpen(true)
      }, 1000)
    }

    const handleResize = () => {
      const isMobileNow = window.matchMedia('(max-width: 640px)').matches
      if (!isMobileNow) {
        setIsOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const toggle = React.useCallback((open?: boolean) => {
    setIsOpen(prev => {
      // If explicit value provided, use that
      if (typeof open === 'boolean') return open
      // Otherwise toggle
      return !prev
    })
  }, [])

  const handleBack = React.useCallback(() => {
    setShowAlert(true)
  }, [])

  const confirmBack = React.useCallback(() => {
    setShowAlert(false)
    router.back()
  }, [router])

  const value = React.useMemo(
    () => ({
      width,
      minWidth: 280,
      maxWidth: 480,
      isOpen,
      showAlert,
      setWidth,
      toggle,
      handleBack,
      confirmBack,
      setShowAlert,
    }),
    [width, isOpen, showAlert, toggle, handleBack, confirmBack]
  )

  return (
    <AnalysisContext.Provider value={value}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const context = React.useContext(AnalysisContext)
  if (!context) {
    throw new Error("useAnalysis must be used within an AnalysisProvider")
  }
  return context
}
