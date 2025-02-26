"use client"

import { ClerkProvider } from "@clerk/nextjs"
import { ThemeProvider as NextThemeProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <ClerkProvider>
      <NextThemeProvider 
        attribute="class"
        defaultTheme="system"
        forcedTheme={props.forcedTheme}
        disableTransitionOnChange
        {...props}
      >
        {children}
        <Toaster />
      </NextThemeProvider>
    </ClerkProvider>
  )
}
