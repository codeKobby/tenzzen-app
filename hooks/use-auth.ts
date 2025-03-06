"use client"

import { useAuth as useClerkAuth, useUser, useSession } from "@clerk/nextjs"
import { useConvexAuth } from "convex/react"
import { useState } from "react"

export function useAuth() {
  const { isLoaded, signOut } = useClerkAuth()
  const { user } = useUser()
  const { session } = useSession()
  const { isAuthenticated } = useConvexAuth()

  return {
    user,
    session,
    isAuthenticated,
    loading: !isLoaded,
    signIn: () => {
      window.location.href = "/sign-in"
    },
    signUp: () => {
      window.location.href = "/sign-up"
    },
    signOut
  }
}
