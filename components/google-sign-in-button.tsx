"use client"

import { useState } from "react"
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"

type ButtonType = "signin" | "signup"

interface GoogleSignInButtonProps {
  type: ButtonType
  className?: string
}

const GoogleIcon = () => (
  <svg viewBox="0 0 18 18" className="h-4 w-4">
    <path
      fill="#4285F4"
      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
    />
    <path
      fill="#34A853"
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
    />
    <path
      fill="#FBBC05"
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
    />
    <path
      fill="#EA4335"
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
    />
  </svg>
)

export function GoogleSignInButton({ type, className = "" }: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${type} with Google`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className={`w-full relative flex items-center justify-center px-4 py-3 rounded-md transition-all
        bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 
        hover:bg-zinc-100 dark:hover:bg-zinc-800 
        shadow-sm hover:shadow
        active:scale-[0.99]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-zinc-50 dark:disabled:hover:bg-zinc-900
        ${className}`}
    >
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-white p-[1px] shadow-sm">
          <GoogleIcon />
        </div>
        <span className="text-[14px] font-medium text-zinc-800 dark:text-zinc-200">
          {type === "signin" ? "Sign in with Google" : "Sign up with Google"}
        </span>
      </div>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-[1px]">
          <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </button>
  )
}