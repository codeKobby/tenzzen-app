"use client"

import { useUser, useSession, useAuth as useClerkAuth } from "@clerk/clerk-react"
import { useConvexAuth } from "convex/react"
import { useRouter } from "next/navigation"

export function useAuth() {
  const router = useRouter()
  const { user } = useUser()
  const { session } = useSession()
  const { signOut } = useClerkAuth()
  const { isAuthenticated, isLoading } = useConvexAuth()

  return {
    user,
    session,
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
    }
  }
}
