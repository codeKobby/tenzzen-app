"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Bug } from "lucide-react"
import { useState } from "react"

export default function ReportBugPage() {
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Report bug functionality will be implemented here
    toast({
      title: "Bug report submitted",
      description: "Thank you for helping us improve Tenzzen",
    })
    setDescription("")
  }

  return (
    <div className="min-h-screen bg-background pt-4 lg:pt-8">
      <div className="mx-auto max-w-[1500px] space-y-8 p-4 lg:p-8">
        <div className="flex items-center gap-3">
          <Bug className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Report Bug</h1>
        </div>
        
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="Please describe the issue you encountered..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[200px]"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Report
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}