"use client"

import { useUser, useSession, useAuth as useClerkAuth } from "@clerk/nextjs"
import { useConvexAuth } from "convex/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export function useAuth() {
  const router = useRouter()
  const { user } = useUser()
  const { session } = useSession()
  const { signOut } = useClerkAuth()
  const { isAuthenticated, isLoading } = useConvexAuth()
  const [mounted, setMounted] = useState(false)

  // Ensure the component using this hook is mounted
  // before accessing browser APIs
  useEffect(() => {
    setMounted(true)
  }, [])

  return {
    user,
    session,
    isAuthenticated,
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
    signOut: async () => {
      if (mounted) {
        await signOut()
        router.push("/sign-in")
      }
    }
  }
}
