"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import { useAnalysis } from "@/hooks/use-analysis-context"

export function CourseGeneration() {
  const { courseGenerating, generationProgress, progressMessage, cancelGeneration } = useAnalysis()

  if (!courseGenerating) return null

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Generating Course</CardTitle>
        <CardDescription>{progressMessage}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={generationProgress} className="h-2" />
        <div className="flex justify-end">
          <Button 
            variant="destructive" 
            size="sm"
            onClick={cancelGeneration}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Cancel Generation
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}