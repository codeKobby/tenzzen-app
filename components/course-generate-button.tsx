"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { YoutubeIcon, BookText } from "lucide-react"
import { createBrowserClient } from '@supabase/ssr'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function CourseGenerateButton() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleNavigation = async (path: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      router.push(path)
    } else {
      router.push('/signup')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="default"
          size="lg" 
          className="group text-lg h-14 bg-gradient-primary hover:bg-gradient-primary-hover text-primary-foreground shadow-lg hover:shadow-xl transition-all"
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
