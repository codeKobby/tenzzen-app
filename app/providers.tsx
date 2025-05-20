"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import { useEffect, useState } from "react"
import { SupabaseProvider } from "@/contexts/supabase-context"
import { UserInitializer } from "@/components/user-initializer"
import { ToastContainer } from "@/components/custom-toast"
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context"

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
      <SupabaseProvider>
        <BreadcrumbProvider>
          {/* Initialize user data when signed in */}
          <UserInitializer />

          {mounted ? children : null}

          {/* Toast notifications - using only one toast system */}
          <ToastContainer />
        </BreadcrumbProvider>
      </SupabaseProvider>
    </NextThemeProvider>
  )
}
