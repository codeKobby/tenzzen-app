'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSupabase } from './use-supabase-hook'

interface UseStreakOptions {
  autoUpdate?: boolean
}

interface StreakData {
  current: number
  longest: number
  loading: boolean
  error: Error | null
  updateStreak: () => Promise<void>
}

/**
 * Hook to manage user streak data
 * @param options Configuration options
 * @returns Streak data and update function
 */
export function useStreak(options: UseStreakOptions = {}): StreakData {
  const { autoUpdate = true } = options
  const { user, isLoaded: isUserLoaded, isSignedIn } = useUser()
  const supabase = useSupabase()
  const [current, setCurrent] = useState<number>(0)
  const [longest, setLongest] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdateDate, setLastUpdateDate] = useState<string | null>(null)

  // Function to update streak via API
  const updateStreak = async () => {
    if (!isUserLoaded || !isSignedIn) return

    try {
      setLoading(true)
      const today = new Date().toISOString().split('T')[0]

      // Only update once per day
      if (lastUpdateDate === today) {
        console.log('Streak already updated today')
        return
      }

      const response = await fetch('/api/users/update-streak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update streak')
      }

      const data = await response.json()
      setCurrent(data.streak)
      setLongest(data.longest_streak)
      setLastUpdateDate(today)

      // Store the last update date in localStorage
      localStorage.setItem(`streak_last_update_${user?.id}`, today)
    } catch (err) {
      console.error('Error updating streak:', err)
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // Fetch initial streak data
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn || !user?.id) {
      setLoading(false)
      return
    }

    const fetchStreakData = async () => {
      try {
        setLoading(true)

        // Get the last update date from localStorage
        const storedLastUpdate = localStorage.getItem(`streak_last_update_${user.id}`)
        if (storedLastUpdate) {
          setLastUpdateDate(storedLastUpdate)
        }

        // First get the Supabase user ID from the Clerk ID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', user.id)
          .single()

        if (userError) throw userError
        if (!userData) throw new Error('User not found in Supabase')

        // Fetch streak data from Supabase
        const { data, error } = await supabase
          .from('user_stats')
          .select('streak_days, longest_streak')
          .eq('user_id', userData.id)
          .single()

        if (error) {
          // For a new user, there might not be an entry yet
          // Set streak to 1 for first login
          console.log('No streak data found, setting initial streak to 1')
          setCurrent(1)
          setLongest(1)

          // Create a new entry in user_stats table
          try {
            await supabase
              .from('user_stats')
              .upsert({
                user_id: userData.id,
                streak_days: 1,
                longest_streak: 1,
                weekly_activity: [0, 0, 0, 0, 0, 0, 0]
              })
            console.log('Created initial user stats entry')
          } catch (insertErr) {
            console.error('Error creating initial user stats:', insertErr)
          }
        } else {
          // If we have data, use it, but ensure streak is at least 1 for today's login
          const streakDays = data.streak_days || 0
          const longestStreak = data.longest_streak || 0

          // If streak is 0 but user is logged in today, set to 1
          setCurrent(streakDays === 0 ? 1 : streakDays)
          setLongest(Math.max(longestStreak, streakDays === 0 ? 1 : streakDays))
        }
      } catch (err) {
        console.error('Error fetching streak data:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchStreakData()
  }, [isUserLoaded, isSignedIn, user?.id, supabase])

  // Auto-update streak on login if enabled
  useEffect(() => {
    if (autoUpdate && isUserLoaded && isSignedIn && user?.id) {
      const today = new Date().toISOString().split('T')[0]

      // Only update once per day
      if (lastUpdateDate !== today) {
        updateStreak()
      }
    }
  }, [autoUpdate, isUserLoaded, isSignedIn, user?.id, lastUpdateDate])

  return {
    current,
    longest,
    loading,
    error,
    updateStreak
  }
}
