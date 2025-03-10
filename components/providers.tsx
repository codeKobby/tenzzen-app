"use client"

import * as React from "react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Toaster richColors position="bottom-right" closeButton />
      {children}
    </ThemeProvider>
  )
}
