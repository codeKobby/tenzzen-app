'use client'

import { useState, useEffect } from 'react'
import { useStreak } from './use-streak'

interface UseStreakCelebrationOptions {
  autoShow?: boolean
  onlyOnDashboard?: boolean
}

interface UseStreakCelebrationResult {
  showCelebration: boolean
  setShowCelebration: (show: boolean) => void
  streak: number
  longestStreak: number
  handleClose: () => void
}

/**
 * Hook to manage streak celebration popup
 * @param options Configuration options
 * @returns Streak celebration state and handlers
 */
export function useStreakCelebration(
  options: UseStreakCelebrationOptions = {}
): UseStreakCelebrationResult {
  const { autoShow = true, onlyOnDashboard = true } = options
  const { current: streak, longest: longestStreak } = useStreak()
  const [showCelebration, setShowCelebration] = useState(false)
  const [hasShownTodayCelebration, setHasShownTodayCelebration] = useState(false)

  // Check if we're on the dashboard page
  const isDashboardPage = typeof window !== 'undefined' &&
    window.location.pathname.includes('/dashboard')

  // Show celebration when streak is updated
  useEffect(() => {
    if (!autoShow) return
    if (onlyOnDashboard && !isDashboardPage) return

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Check if we've already shown the celebration today
    const lastCelebrationDate = localStorage.getItem('streak_celebration_date')

    console.log('Streak celebration check:', {
      streak,
      hasShownTodayCelebration,
      lastCelebrationDate,
      today,
      shouldShow: !hasShownTodayCelebration && lastCelebrationDate !== today
    })

    // Only show celebration once per day
    // Note: We removed the streak > 0 check to ensure it shows for new users
    if (
      !hasShownTodayCelebration &&
      lastCelebrationDate !== today
    ) {
      // Show celebration with a slight delay to ensure page is loaded
      const timer = setTimeout(() => {
        console.log('Showing streak celebration popup')
        setShowCelebration(true)
        setHasShownTodayCelebration(true)
        localStorage.setItem('streak_celebration_date', today)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [
    streak,
    autoShow,
    hasShownTodayCelebration,
    onlyOnDashboard,
    isDashboardPage
  ])

  // Handle closing the celebration popup
  const handleClose = () => {
    setShowCelebration(false)
  }

  return {
    showCelebration,
    setShowCelebration,
    streak,
    longestStreak,
    handleClose
  }
}
