"use client"

import React, { useEffect, useState } from 'react'
import Lottie from 'lottie-react'

// Cache for storing animation data to avoid re-fetching
const animationCache = new Map<string, any>();

// Define animation mappings with local paths
const ANIMATION_MAPPINGS: Record<string, string> = {
  '🔥': '/animations/fire.json', // Fire animation
  '🏆': '/animations/trophy.json', // Trophy animation
  '⭐': '/animations/star.json', // Star animation
  '✨': '/animations/fallback.json', // Sparkles animation (using fallback for now)
  '🎯': '/animations/fallback.json', // Target animation (using fallback for now)
  '🎊': '/animations/fallback.json', // Confetti animation (using fallback for now)
  '🚀': '/animations/fallback.json', // Rocket animation (using fallback for now)
  '🌱': '/animations/fallback.json', // Plant animation (using fallback for now)
  '💪': '/animations/fallback.json', // Muscle/strength animation (using fallback for now)
  '🌈': '/animations/fallback.json', // Rainbow animation (using fallback for now)
  '💯': '/animations/fallback.json', // 100 animation (using fallback for now)
  '✅': '/animations/fallback.json', // Checkmark animation (using fallback for now)
}

// Fallback animation for emojis that don't have a specific animation
const FALLBACK_ANIMATION = '/animations/fallback.json'

interface AnimatedEmojiProps {
  emoji: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  className?: string
}

export function AnimatedEmoji({ emoji, size = 'lg', className = '' }: AnimatedEmojiProps) {
  const [animationData, setAnimationData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Determine size class
  const sizeClass = {
    'sm': 'h-4 w-4 text-sm',
    'md': 'h-6 w-6 text-md',
    'lg': 'h-8 w-8 text-lg',
    'xl': 'h-10 w-10 text-xl',
    '2xl': 'h-12 w-12 text-2xl',
    '3xl': 'h-16 w-16 text-3xl',
    '4xl': 'h-20 w-20 text-4xl',
  }[size] || 'h-8 w-8 text-lg'

  useEffect(() => {
    // Get the animation URL for the emoji, or use fallback
    const animationUrl = ANIMATION_MAPPINGS[emoji] || FALLBACK_ANIMATION

    // Check if we already have this animation in the cache
    if (animationCache.has(animationUrl)) {
      setAnimationData(animationCache.get(animationUrl));
      setLoading(false);
      return;
    }

    // Fetch the animation data
    const controller = new AbortController();

    // Function to handle animation loading errors
    const handleAnimationError = (error: any) => {
      if (error.name !== 'AbortError') {
        console.error('Error loading animation:', error);

        // If the error is with the specific animation, try the fallback
        if (animationUrl !== FALLBACK_ANIMATION) {
          console.log('Trying fallback animation instead');

          // Only try the fallback if we're not already using it
          fetch(FALLBACK_ANIMATION, { signal: controller.signal })
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch fallback animation: ${response.status}`);
              }
              return response.json();
            })
            .then(data => {
              animationCache.set(FALLBACK_ANIMATION, data);
              setAnimationData(data);
              setLoading(false);
            })
            .catch(() => {
              // If even the fallback fails, just show the emoji
              console.error('Fallback animation also failed, showing static emoji');
              setLoading(false);
            });
        } else {
          // If we're already using the fallback, just show the emoji
          setLoading(false);
        }
      }
    };

    fetch(animationUrl, { signal: controller.signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch animation: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Store in cache for future use
        animationCache.set(animationUrl, data);
        setAnimationData(data);
        setLoading(false);
      })
      .catch(handleAnimationError);

    return () => {
      controller.abort(); // Cleanup on unmount or when emoji changes
    };
  }, [emoji])

  // Show the emoji as fallback while loading
  if (loading || !animationData) {
    return <span className={`inline-block ${sizeClass} ${className}`}>{emoji}</span>
  }

  return (
    <div className={`inline-block ${sizeClass} ${className}`}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        className="w-full h-full"
      />
    </div>
  )
}
