"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { YoutubeIcon } from "lucide-react"
import { createBrowserClient } from '@supabase/ssr'

export function CourseGenerateButton() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleClick = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      router.push('/explore')
    } else {
      router.push('/signup')
    }
  }

  return (
    <Button 
      size="lg" 
      className="group text-lg h-14"
      onClick={handleClick}
    >
      <span className="relative z-10 flex items-center">
        Generate Course
        <YoutubeIcon className="ml-2 h-5 w-5 transition-transform group-hover:scale-110" />
      </span>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary to-primary/80 opacity-100" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </Button>
  )
}