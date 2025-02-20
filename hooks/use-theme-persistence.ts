"use client"

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { createBrowserClient } from '@supabase/ssr'
import { User } from '@supabase/supabase-js'

type ColorTheme = 'purple' | 'neutral' | 'minimal'

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
      document.documentElement.classList.remove('theme-purple', 'theme-neutral', 'theme-minimal')
      document.documentElement.classList.add(`theme-${colorTheme}`)
    }

    const darkMode = localStorage.getItem('darkMode')
    if (darkMode) {
      setTheme(darkMode)
    }
  }, [setTheme])

  // Load theme from database after authentication
  useEffect(() => {
    if (!user) return

    const loadUserTheme = async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('theme, color_theme')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error loading theme:', error)
        return
      }

      if (data) {
        setTheme(data.theme)
        if (data.color_theme) {
          document.documentElement.classList.remove('theme-purple', 'theme-neutral', 'theme-minimal')
          document.documentElement.classList.add(`theme-${data.color_theme}`)
          localStorage.setItem('colorTheme', data.color_theme)
        }
      }
    }

    loadUserTheme()
  }, [user, setTheme, supabase])

  const updateTheme = async (newTheme: string, colorTheme?: ColorTheme) => {
    // Update local storage
    localStorage.setItem('darkMode', newTheme)
    if (colorTheme) {
      localStorage.setItem('colorTheme', colorTheme)
    }

    // Update theme
    setTheme(newTheme)
    
    // Update in database if user is authenticated
    if (user) {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          theme: newTheme,
          color_theme: colorTheme || undefined,
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error saving theme:', error)
      }
    }
  }

  return { updateTheme }
}
