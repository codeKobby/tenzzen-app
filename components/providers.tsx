"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider 
      attribute="class"
      defaultTheme="system"
      forcedTheme={props.forcedTheme}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemeProvider>
  )
}
