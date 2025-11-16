'use client'

import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useUser } from '@clerk/nextjs'
import { useEffect } from 'react'

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

  const streakData = useQuery(
    api.streaks.getStreak,
    user?.id ? { userId: user.id } : 'skip'
  )

  const checkInMutation = useMutation(api.streaks.checkInStreak)

  const updateStreak = async () => {
    if (!user?.id) return

    try {
      await checkInMutation({ userId: user.id })
    } catch (err) {
      console.error('Failed to update streak:', err)
    }
  }

  // Auto-update streak on login if enabled
  useEffect(() => {
    if (autoUpdate && isUserLoaded && isSignedIn && user?.id && streakData) {
      const today = new Date().toISOString().split('T')[0]

      // Only update if not checked in today
      if (streakData.lastCheckIn !== today) {
        updateStreak()
      }
    }
  }, [autoUpdate, isUserLoaded, isSignedIn, user?.id, streakData])

  return {
    current: streakData?.streakDays || 0,
    longest: streakData?.longestStreak || 0,
    loading: !streakData && isUserLoaded && isSignedIn,
    error: null, // Convex handles errors internally
    updateStreak
  }
}
