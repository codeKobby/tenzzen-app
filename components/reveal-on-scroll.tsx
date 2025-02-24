'use client'

import { useEffect, useRef } from 'react'
import { motion, useInView, useAnimation } from 'framer-motion'

interface RevealOnScrollProps {
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  className?: string
  duration?: number
}

export function RevealOnScroll({
  children,
  direction = 'up',
  delay = 0,
  className = '',
  duration = 0.5,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, {
    once: true,
    margin: "-50px",
  })
  const controls = useAnimation()

  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        y: 0,
        x: 0,
        transition: {
          duration: duration,
          delay: delay,
          ease: [0.25, 0.1, 0.25, 1],
        },
      })
    }
  }, [isInView, controls, delay, duration])

  const initialX = direction === 'left' ? -50 : direction === 'right' ? 50 : 0
  const initialY = direction === 'up' ? 50 : direction === 'down' ? -50 : 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: initialX, y: initialY }}
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function RevealContainer({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, {
    once: true,
    margin: "-50px",
  })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.7,
          ease: [0.25, 0.1, 0.25, 1],
        }
      } : {}}
      className={className}
    >
      {children}
    </motion.div>
  )
}
