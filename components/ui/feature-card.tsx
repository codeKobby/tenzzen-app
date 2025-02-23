'use client'

import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { motion, useMotionTemplate, useSpring, HTMLMotionProps } from 'framer-motion'

interface FeatureCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: React.ReactNode
  className?: string
}

export function FeatureCard({ children, className, ...props }: FeatureCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Spring animations for smoother movement
  const rotateX = useSpring(0, { stiffness: 100, damping: 30 })
  const rotateY = useSpring(0, { stiffness: 100, damping: 30 })
  const glowX = useSpring('50%')
  const glowY = useSpring('50%')

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const { left, top, width, height } = cardRef.current.getBoundingClientRect()
    const { clientX, clientY } = event

    const x = clientX - left
    const y = clientY - top

    // Update glow position with percentages
    glowX.set(`${(x / width) * 100}%`)
    glowY.set(`${(y / height) * 100}%`)

    // Calculate rotation based on mouse position relative to card center
    const centerX = width / 2
    const centerY = height / 2
    const rotX = ((y - centerY) / height) * 20 // 20 degrees max rotation
    const rotY = ((x - centerX) / width) * 20

    rotateX.set(rotX)
    rotateY.set(rotY)
  }

  const handleMouseLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
    glowX.set('50%')
    glowY.set('50%')
  }

  const glowBackground = useMotionTemplate`radial-gradient(
    800px circle at ${glowX} ${glowY},
    rgba(var(--primary-rgb), 0.15),
    transparent 40%
  )`

  return (
    <motion.div
      ref={cardRef}
      className={cn('feature-card group relative', className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      {...props}
    >
      <motion.div 
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: glowBackground
        }}
      />

      <motion.div
        className="feature-card-inner relative"
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          transformPerspective: '1200px'
        }}
      >
        <div className="relative z-10 h-full">
          {children}
        </div>
      </motion.div>

      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.5, 0],
          background: [
            'linear-gradient(to right, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.1))',
            'linear-gradient(to right, rgba(var(--primary-rgb), 0.1), rgba(var(--primary-rgb), 0.2))',
          ]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        style={{
          WebkitMaskImage: 'linear-gradient(black, black)',
          WebkitMaskSize: '100% 100%',
          WebkitMaskPosition: '0 0',
          WebkitMaskComposite: 'source-out',
        }}
      />
    </motion.div>
  )
}
