"use client"

import { useTheme } from 'next-themes'

type ColorTheme = 'purple' | 'neutral' | 'minimal' | 'modern'
type ThemeMode = 'light' | 'dark' | 'system'

export function useThemePersistence() {
  const { setTheme } = useTheme()

  const updateTheme = async (newTheme: ThemeMode, colorTheme?: ColorTheme) => {
    // Update theme mode in localStorage
    localStorage.setItem('darkMode', newTheme)
    
    // Update color theme if provided
    if (colorTheme) {
      localStorage.setItem('colorTheme', colorTheme)
      document.documentElement.classList.remove('theme-purple', 'theme-neutral', 'theme-minimal', 'theme-modern')
      document.documentElement.classList.add(`theme-${colorTheme}`)
    }

    // Update theme in next-themes
    setTheme(newTheme)
  }

  return { updateTheme }
}
