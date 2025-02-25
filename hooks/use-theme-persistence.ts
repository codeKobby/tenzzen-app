"use client"

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'

type ColorTheme = 'purple' | 'neutral' | 'minimal' | 'modern'

export function useThemePersistence() {
  const { theme, setTheme } = useTheme()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Load theme from localStorage on mount
  useEffect(() => {
    const colorTheme = localStorage.getItem('colorTheme') as ColorTheme | null
    if (colorTheme) {
      document.documentElement.classList.remove('theme-purple', 'theme-neutral', 'theme-minimal', 'theme-modern')
      document.documentElement.classList.add(`theme-${colorTheme}`)
    }

    const darkMode = localStorage.getItem('darkMode')
    if (darkMode) {
      setTheme(darkMode)
    }
  }, [setTheme])

  // Database persistence removed temporarily - will be implemented later
  // For now, we're only using local storage for theme persistence

  const updateTheme = async (newTheme: string, colorTheme?: ColorTheme) => {
    // Update local storage
    localStorage.setItem('darkMode', newTheme)
    if (colorTheme) {
      localStorage.setItem('colorTheme', colorTheme)
      
      // Update color theme class
      document.documentElement.classList.remove('theme-purple', 'theme-neutral', 'theme-minimal', 'theme-modern')
      document.documentElement.classList.add(`theme-${colorTheme}`)
    }

    // Update theme
    setTheme(newTheme)
    
    // Database persistence removed temporarily - will be implemented later
  }

  return { updateTheme }
}
