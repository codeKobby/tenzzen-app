"use client"

import { useUser, useSession } from "@clerk/nextjs"
import { useConvexAuth } from "convex/react"

export function useAuth() {
  const { user } = useUser()
  const { session } = useSession()
  const { isAuthenticated, isLoading } = useConvexAuth()

  return {
    user,
    session,
    isAuthenticated,
    loading: isLoading,
    signIn: () => {
      window.location.href = "/sign-in"
    },
    signUp: () => {
      window.location.href = "/sign-up"
    },
    signOut: async () => {
      await session?.end()
    }
  }
}
