"use client"

import { useRouter } from "@/hooks/use-router-with-loader"
import { Button } from "@/components/ui/button"
import { YoutubeIcon, BookText } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CourseGenerateButtonProps {
  className?: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function CourseGenerateButton({ className, size = "default", variant = "default" }: CourseGenerateButtonProps) {
  const router = useRouter()
  const { userId } = useAuth()

  const handleNavigation = async (path: string) => {
    if (userId) {
      router.push(path)
    } else {
      router.push('/sign-up')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "group transition-all",
            className
          )}
        >
          <span className="flex items-center">
            Generate Course
            <YoutubeIcon className="ml-2 h-5 w-5 transition-transform group-hover:scale-110" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => handleNavigation('/explore/youtube')}
        >
          <YoutubeIcon className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>From YouTube Content</span>
            <span className="text-xs text-muted-foreground">Use videos or playlists</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="flex items-center cursor-pointer"
          onClick={() => handleNavigation('/explore/topic')}
        >
          <BookText className="mr-2 h-4 w-4" />
          <div className="flex flex-col">
            <span>From Topic</span>
            <span className="text-xs text-muted-foreground">Generate based on learning goals</span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
