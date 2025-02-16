'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, Youtube, Clock, PlayCircle } from 'lucide-react'
import Link from 'next/link'

export function DemoDialog({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState<'input' | 'processing' | 'preview'>('input')
  const [videoUrl, setVideoUrl] = useState('')
  const [progress, setProgress] = useState(0)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('processing')
    // Simulate progress
    let currentProgress = 0
    const interval = setInterval(() => {
      if (currentProgress >= 100) {
        clearInterval(interval)
        setStep('preview')
      } else {
        currentProgress += 10
        setProgress(currentProgress)
      }
    }, 500)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Try Course Generation</DialogTitle>
          <DialogDescription>
            See how LearnFlow transforms YouTube content into structured courses
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {step === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Paste a YouTube video URL..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full"
              />
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Youtube className="h-4 w-4" />
                <span>Try with any educational video</span>
              </div>
              <Button
                type="submit"
                disabled={!videoUrl}
                className="w-full"
              >
                Generate Course
              </Button>
            </form>
          )}

          {step === 'processing' && (
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Processing Video</CardTitle>
                  <CardDescription>
                    Our AI is analyzing the content...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {progress >= 30 ? (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">Content Analysis</p>
                    <p className="text-sm text-muted-foreground">
                      Extracting key concepts and learning objectives
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {progress >= 60 ? (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">Course Structure</p>
                    <p className="text-sm text-muted-foreground">
                      Creating modules and learning path
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {progress >= 90 ? (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  ) : (
                    <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                  )}
                  <div>
                    <p className="font-medium">Resource Generation</p>
                    <p className="text-sm text-muted-foreground">
                      Generating quizzes and supplementary materials
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Preview</CardTitle>
                  <CardDescription>
                    Here's what we generated from your video
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Estimated duration: 2 hours</span>
                  </div>
                  <div className="space-y-2">
                    {['Introduction', 'Key Concepts', 'Practical Examples', 'Summary'].map((module, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg border"
                      >
                        <PlayCircle className="h-4 w-4 text-primary" />
                        <span>{module}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <AlertDescription>
                  Create an account to access the full course and all features
                </AlertDescription>
              </Alert>

              <div className="flex gap-4">
                <Button asChild className="w-full">
                  <Link href="/signup">Create Free Account</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
