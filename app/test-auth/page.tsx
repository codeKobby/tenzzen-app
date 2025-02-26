"use client"

import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"

export default function TestAuth() {
  const { user, session, supabase, loading, signIn, signOut } = useAuth()
  const [testData, setTestData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Test Supabase query when auth state changes
  useEffect(() => {
    async function testSupabase() {
      if (!supabase || !user) {
        setTestData(null)
        return
      }

      try {
        // Try to query Supabase
        const { data, error: queryError } = await supabase
          .from("your_table")
          .select("*")
          .limit(1)

        if (queryError) throw queryError
        setTestData(data)
        setError(null)
      } catch (e) {
        console.error("Supabase query error:", e)
        setError(e instanceof Error ? e.message : "Unknown error occurred")
      }
    }

    testSupabase()
  }, [supabase, user])

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Loading...</h1>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Auth Test Page</h1>
      
      {/* Auth State */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Auth State:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(
            {
              user: user ? {
                id: user.id,
                email: user.emailAddresses[0]?.emailAddress
              } : null,
              sessionId: session?.id,
              hasSupabaseClient: !!supabase
            },
            null,
            2
          )}
        </pre>
      </div>

      {/* Supabase Test Results */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Supabase Test:</h2>
        {error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : testData ? (
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(testData, null, 2)}
          </pre>
        ) : (
          <div>No data available</div>
        )}
      </div>

      {/* Auth Actions */}
      <div className="space-x-4">
        {!user ? (
          <button
            onClick={signIn}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Sign In
          </button>
        ) : (
          <button
            onClick={() => signOut()}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Sign Out
          </button>
        )}
      </div>
    </div>
  )
}