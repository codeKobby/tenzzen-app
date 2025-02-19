"use client"

import { ThemeProvider as NextThemeProvider } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider 
      attribute="class"
      defaultTheme="light"
      value={{
        light: "theme-purple",
        dark: "theme-purple dark",
        system: "theme-purple",
      }}
      {...props}
    >
      {children}
    </NextThemeProvider>
  )
}
