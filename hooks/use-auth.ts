"use client"

<<<<<<< HEAD
import { useUser, useSession, useAuth as useClerkAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
=======
import { useUser, useSession, useAuth as useClerkAuth } from "@clerk/clerk-react"
import { useConvexAuth } from "convex/react"
import { useRouter } from "next/navigation"
>>>>>>> master

export function useAuth() {
  const router = useRouter()
  const { user } = useUser()
  const { session } = useSession()
  const { signOut } = useClerkAuth()
<<<<<<< HEAD
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Ensure the component using this hook is mounted
  // before accessing browser APIs
  useEffect(() => {
    setMounted(true)
    setIsLoading(false)
  }, [])
=======
  const { isAuthenticated, isLoading } = useConvexAuth()
>>>>>>> master

  return {
    user,
    session,
<<<<<<< HEAD
    isAuthenticated: !!user,
    loading: isLoading || !mounted,
    signIn: () => {
      if (mounted) {
        router.push("/sign-in")
      }
    },
    signUp: () => {
      if (mounted) {
        router.push("/sign-up")
      }
    },
    signOut: async ({ redirectUrl }: { redirectUrl?: string } = {}) => {
      if (mounted) {
        try {
          await signOut({ redirectUrl: redirectUrl || "/sign-in" })
          // Clerk will handle the redirect
        } catch (error) {
          console.error("Error signing out:", error)
          // If Clerk fails to redirect, do it manually
          if (redirectUrl) {
            router.push(redirectUrl)
          } else {
            router.push("/sign-in")
          }
        }
      }
=======
    isAuthenticated,
    loading: isLoading,
    signIn: () => {
      router.push("/sign-in")
    },
    signUp: () => {
      router.push("/sign-up")
    },
    signOut: async () => {
      await signOut()
      router.push("/sign-in")
>>>>>>> master
    }
  }
}
