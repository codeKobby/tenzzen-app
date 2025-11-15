import React from 'react'
import { Shell } from "@/components/shell"

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return (
    <Shell
      padding="none"
      scroll={false}
    >
      {children}
    </Shell>
  )
}
