"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuth } from "@clerk/nextjs"

export default function UpdateNotesTablePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const router = useRouter()
  const { isSignedIn } = useAuth()

  const handleUpdateTable = async () => {
    if (!isSignedIn) {
      toast.error("You must be signed in to perform this action")
      return
    }

    try {
      setIsLoading(true)
      setResult(null)

      const response = await fetch('/api/supabase/update-notes-table', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update notes table')
      }

      setResult("Success! The user_notes table has been updated with the new fields.")
      toast.success("Notes table updated successfully")
    } catch (error) {
      console.error('Error updating notes table:', error)
      setResult(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`)
      toast.error("Failed to update notes table")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Update Notes Table</CardTitle>
          <CardDescription>
            This will add the category, tags, and starred fields to the user_notes table.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This operation should only be performed once. It will add new fields to the user_notes table
            to support the enhanced note-taking functionality.
          </p>
          {result && (
            <div className={`p-3 rounded-md text-sm ${result.startsWith('Error') ? 'bg-destructive/10 text-destructive' : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'}`}>
              {result}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push('/')}>
            Cancel
          </Button>
          <Button onClick={handleUpdateTable} disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Table"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
