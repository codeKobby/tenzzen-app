'use client'

import { Check, X } from 'lucide-react'

interface YouTubeRequirement {
  text: string
  validator: (value: string) => boolean
}

const requirements: YouTubeRequirement[] = [
  {
    text: 'Must be a valid YouTube URL',
    validator: (value) => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(value),
  },
  {
    text: 'Contains video or playlist ID',
    validator: (value) => {
      const videoPattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
      const playlistPattern = /[?&]list=([^#\&\?]+)/
      return videoPattern.test(value) || playlistPattern.test(value)
    },
  },
  {
    text: 'URL is accessible',
    validator: (value) => {
      // In a real app, you would want to validate this on the server
      // For now, we'll just check if it's a well-formed URL
      try {
        new URL(value)
        return true
      } catch {
        return false
      }
    },
  },
]

interface YouTubeValidatorProps {
  url: string
  setIsValid?: (isValid: boolean) => void
}

export function YouTubeValidator({ url, setIsValid }: YouTubeValidatorProps) {
  const validRequirements = requirements.filter((req) => req.validator(url))
  const isAllValid = validRequirements.length === requirements.length

  // Update parent component if needed
  if (setIsValid) {
    setIsValid(isAllValid)
  }

  return (
    <div className="grid gap-2 text-sm">
      {requirements.map((requirement, index) => {
        const isValid = requirement.validator(url)
        return (
          <div
            key={index}
            className="flex items-center gap-2"
            style={{
              opacity: url.length > 0 ? 1 : 0.5,
            }}
          >
            <div className="h-5 w-5 flex items-center justify-center">
              {isValid ? (
                <Check className="h-4 w-4 text-primary" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className={isValid ? 'text-primary' : 'text-muted-foreground'}>
              {requirement.text}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function getVideoId(url: string): string | null {
  const pattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  const match = url.match(pattern)
  return match ? match[1] : null
}

export function getPlaylistId(url: string): string | null {
  const pattern = /[?&]list=([^#\&\?]+)/
  const match = url.match(pattern)
  return match ? match[1] : null
}
