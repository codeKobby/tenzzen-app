"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface BreadcrumbContextType {
  courseTitle: string | null
  setCourseTitleForPath: (path: string, title: string) => void
  getCourseTitle: (path: string) => string | null
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined)

export function BreadcrumbProvider({ children }: { children: ReactNode }) {
  const [courseTitles, setCourseTitles] = useState<Record<string, string>>({})

  const setCourseTitleForPath = (path: string, title: string) => {
    setCourseTitles(prev => ({
      ...prev,
      [path]: title
    }))
  }

  const getCourseTitle = (path: string) => {
    return courseTitles[path] || null
  }

  return (
    <BreadcrumbContext.Provider value={{
      courseTitle: null, // Deprecated, use getCourseTitle instead
      setCourseTitleForPath,
      getCourseTitle
    }}>
      {children}
    </BreadcrumbContext.Provider>
  )
}

export function useBreadcrumb() {
  const context = useContext(BreadcrumbContext)
  if (context === undefined) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider')
  }
  return context
}
