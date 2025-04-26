"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { useAuth } from "@clerk/nextjs"
import { convex } from "@/hooks/use-convex"
import { useEffect, useState } from "react"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [mounted, setMounted] = useState(false)

  // Ensure hydration completes before rendering content
  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {mounted ? children : null}
        <Toaster />
      </ConvexProviderWithClerk>
    </NextThemeProvider>
  )
}
