"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/toaster"
import { ConvexClientProvider } from "@/app/ConvexClientProvider"
import { BreadcrumbProvider } from "@/contexts/breadcrumb-context"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexClientProvider>
        <BreadcrumbProvider>
          {children}
          <Toaster />
        </BreadcrumbProvider>
      </ConvexClientProvider>
    </NextThemeProvider>
  )
}
