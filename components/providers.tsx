"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"
import { Toaster } from "@/components/ui/toaster"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      forcedTheme={props.forcedTheme}
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
      <Toaster />
    </NextThemeProvider>
  )
}
