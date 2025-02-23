'use client'

import { YoutubeIcon, Play } from "lucide-react"
import { motion } from "framer-motion"

interface YouTubePreviewProps {
  className?: string
}

export function YouTubePreview({ className = "" }: YouTubePreviewProps) {
  return (
    <div className={`youtube-embed-placeholder group ${className}`}>
      <div className="play-button">
        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors" />
          <div className="relative size-20 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Play className="h-10 w-10 text-primary fill-primary group-hover:scale-110 transition-transform" />
          </div>
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
        <div className="mt-4 text-center">
          <h3 className="text-lg font-medium">Watch Platform Demo</h3>
          <p className="text-sm text-muted-foreground">See how our AI transforms videos into interactive courses</p>
        </div>
      </div>
    </div>
  )
}
