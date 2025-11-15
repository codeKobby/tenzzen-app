'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X, Award, Flame, Trophy, Target, Calendar } from 'lucide-react'
import { AnimatedEmoji } from './animated-emoji'

interface StreakCelebrationPopupProps {
  streak: number
  longestStreak: number
  onClose: () => void
  isOpen: boolean
}

// Custom hook for window size
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Call handler right away so state gets updated with initial window size
    handleResize();

    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount and unmount

  return windowSize;
}

export function StreakCelebrationPopup({
  streak,
  longestStreak,
  onClose,
  isOpen
}: StreakCelebrationPopupProps) {
  const { width, height } = useWindowSize();
  const [confettiPieces, setConfettiPieces] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [progressToNextMilestone, setProgressToNextMilestone] = useState(0)
  const [nextMilestone, setNextMilestone] = useState(0)
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState('')

  // Calculate milestone information
  useEffect(() => {
    if (!isOpen) return

    // Ensure streak is at least 1 for display purposes
    const displayStreak = Math.max(1, streak)

    // Define milestones
    const milestones = [7, 14, 30, 60, 100, 180, 365]

    // Find next milestone
    const next = milestones.find(m => m > displayStreak) || (displayStreak + 10)
    setNextMilestone(next)

    // Calculate progress to next milestone
    const prevMilestone = milestones.filter(m => m < displayStreak).pop() || 0
    const progress = ((displayStreak - prevMilestone) / (next - prevMilestone)) * 100
    setProgressToNextMilestone(progress)

    // Set confetti pieces based on streak milestones
    let pieces = 50 // Base amount
    if (displayStreak >= 7) pieces = 100
    if (displayStreak >= 14) pieces = 150
    if (displayStreak >= 30) pieces = 200
    if (displayStreak >= 100) pieces = 300

    // Special case for new record
    if (displayStreak > 0 && displayStreak === longestStreak && displayStreak > 1) {
      pieces += 100 // Extra confetti for new record
    }

    // Special case for first day - always show confetti
    if (displayStreak === 1) {
      pieces = 75 // Special welcome confetti
    }

    setConfettiPieces(pieces)

    // Show confetti with a slight delay for better animation effect
    setTimeout(() => {
      setShowConfetti(true)
    }, 300)

    // Set celebration message
    setCelebrationMessage(displayStreak, longestStreak)
  }, [streak, longestStreak, isOpen])

  // Set celebration message based on streak
  const setCelebrationMessage = (streak: number, longestStreak: number) => {
    // Set title based on streak
    if (streak <= 0) {
      // Fallback for zero or negative streak (shouldn't happen, but just in case)
      setTitle('Welcome to Tenzzen!')
      setMessage("You've started your learning journey! Come back tomorrow to build your streak.")
    } else if (streak === 1) {
      setTitle('Day 1!')
      setMessage("You've started your learning journey! Come back tomorrow to keep your streak going.")
    } else if (streak === longestStreak && streak > 1) {
      setTitle(`New Record: ${streak} Days!`)
      setMessage("Congratulations! You've achieved your longest streak ever. Keep up the amazing work!")
    } else if (streak >= 100) {
      setTitle(`Incredible: ${streak} Days!`)
      setMessage("You're a learning machine! Your dedication is truly inspiring.")
    } else if (streak >= 30) {
      setTitle(`Amazing: ${streak} Days!`)
      setMessage("You're on fire! A month of consistent learning is a huge achievement.")
    } else if (streak >= 14) {
      setTitle(`Awesome: ${streak} Days!`)
      setMessage("Two weeks of consistent learning! You're building a powerful habit.")
    } else if (streak >= 7) {
      setTitle(`Great Job: ${streak} Days!`)
      setMessage("A full week of learning! You're building momentum.")
    } else if (streak > 1) {
      setTitle(`${streak} Day Streak!`)
      setMessage("You're building a learning habit. Keep coming back daily!")
    }
  }

  // Get streak icon based on streak length
  const getStreakIcon = () => {
    // Ensure streak is at least 0 for display purposes
    const displayStreak = Math.max(0, streak)

    // Return animated emoji icons
    if (displayStreak >= 100) {
      return (
        <div className="flex items-center justify-center gap-1">
          <AnimatedEmoji emoji="🏆" size="4xl" />
          <AnimatedEmoji emoji="💯" size="4xl" />
        </div>
      )
    }
    if (displayStreak >= 30) {
      return (
        <div className="flex items-center justify-center gap-1">
          <AnimatedEmoji emoji="🔥" size="4xl" />
          <AnimatedEmoji emoji="🚀" size="4xl" />
        </div>
      )
    }
    if (displayStreak >= 14) {
      return (
        <div className="flex items-center justify-center gap-1">
          <AnimatedEmoji emoji="💪" size="4xl" />
          <AnimatedEmoji emoji="⭐" size="4xl" />
        </div>
      )
    }
    if (displayStreak >= 7) {
      return (
        <div className="flex items-center justify-center gap-1">
          <AnimatedEmoji emoji="✨" size="4xl" />
          <AnimatedEmoji emoji="🌈" size="4xl" />
        </div>
      )
    }
    if (displayStreak >= 1) {
      return (
        <div className="flex items-center justify-center gap-1">
          <AnimatedEmoji emoji="🎯" size="4xl" />
          <AnimatedEmoji emoji="🎊" size="4xl" />
        </div>
      )
    }
    return (
      <div className="flex items-center justify-center gap-1">
        <AnimatedEmoji emoji="🌱" size="4xl" />
        <AnimatedEmoji emoji="🌟" size="4xl" />
      </div>
    )
  }

  // Handle close and cleanup
  const handleClose = () => {
    setShowConfetti(false)
    setTimeout(() => {
      onClose()
    }, 300)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          {showConfetti && (
            <Confetti
              width={width}
              height={height}
              numberOfPieces={confettiPieces}
              recycle={false}
              gravity={0.2}
              tweenDuration={5000}
              colors={[
                '#FF0000', // Red
                '#FF7F00', // Orange
                '#FFFF00', // Yellow
                '#00FF00', // Green
                '#0000FF', // Blue
                '#4B0082', // Indigo
                '#9400D3', // Violet
                '#FF1493', // Pink
                '#FFD700', // Gold
                '#00FFFF', // Cyan
                '#FF00FF', // Magenta
                '#32CD32'  // Lime Green
              ]}
              confettiSource={{
                x: width / 2,
                y: height / 2,
                w: 0,
                h: 0
              }}
            />
          )}

          <motion.div
            className="relative w-full max-w-md bg-card rounded-xl shadow-lg overflow-hidden animate-bounce-in"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/80 transition-colors"
              onClick={handleClose}
              aria-label="Close"
              title="Close"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>

            <div className="p-6 flex flex-col items-center text-center">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="mb-4 animate-float-y"
              >
                {getStreakIcon()}
              </motion.div>

              <motion.h2
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent"
              >
                {title}
              </motion.h2>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground mb-6"
              >
                {message} {streak === 1 ?
                  <AnimatedEmoji emoji="🎉" size="md" /> :
                  streak >= 100 ?
                    <span className="inline-flex gap-1">
                      <AnimatedEmoji emoji="🔥" size="md" />
                      <AnimatedEmoji emoji="🏆" size="md" />
                    </span> :
                  streak >= 30 ?
                    <AnimatedEmoji emoji="🔥" size="md" /> :
                  streak >= 14 ?
                    <AnimatedEmoji emoji="💪" size="md" /> :
                  streak >= 7 ?
                    <AnimatedEmoji emoji="✨" size="md" /> :
                    <AnimatedEmoji emoji="🎯" size="md" />
                }
              </motion.p>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full mb-6"
              >
                <div className="flex justify-between text-sm mb-1">
                  <span className="flex items-center gap-1">
                    Progress to next milestone
                    <AnimatedEmoji emoji="🏁" size="sm" />
                  </span>
                  <span className="flex items-center gap-1">
                    {streak} / {nextMilestone} days
                    <AnimatedEmoji emoji="✨" size="sm" />
                  </span>
                </div>
                <Progress
                  value={progressToNextMilestone}
                  className="h-2.5 bg-gradient-to-r from-blue-200 to-blue-300"
                  indicatorClassName="bg-gradient-to-r from-primary via-blue-500 to-primary"
                />
              </motion.div>

              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button onClick={handleClose} className="min-w-32 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-600">
                  Keep it up! <AnimatedEmoji emoji="🚀" size="md" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
