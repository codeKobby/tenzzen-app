"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { CourseGenerationProgress } from "./course-generation-progress"
import { getVideoId, getPlaylistId } from "./youtube-validator"

const youtubeUrlPattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/

const formSchema = z.object({
  contentType: z.enum(["video", "playlist", "channel"]),
  url: z.string()
    .url("Please enter a valid URL")
    .refine(
      (url) => youtubeUrlPattern.test(url),
      "Must be a valid YouTube URL"
    )
    .refine(
      (url) => {
        const videoId = getVideoId(url)
        const playlistId = getPlaylistId(url)
        return videoId !== null || playlistId !== null
      },
      "URL must contain a valid video or playlist ID"
    )
    .superRefine((url, ctx) => {
      // Content-type specific validation
      const videoId = getVideoId(url)
      const playlistId = getPlaylistId(url)

      if (ctx.path[0] === "url") {
        const formData = ctx.path[2] as { contentType: string }

        if (formData.contentType === "video" && !videoId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must be a valid YouTube video URL",
          })
        }

        if (formData.contentType === "playlist" && !playlistId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must be a valid YouTube playlist URL",
          })
        }

        if (formData.contentType === "channel") {
          const channelPattern = /^https?:\/\/(www\.)?youtube\.com\/(c|channel|user)\/[\w-]+/
          if (!channelPattern.test(url)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Must be a valid YouTube channel URL",
            })
          }
        }
      }
    }),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  aiAnalysis: z.boolean().default(true),
})

export function YoutubeContentForm() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const router = useRouter()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      setProgress(0)
      setProgressMessage("Validating URL...")

      // 1. Server-side validation
      const validateRes = await fetch("/api/youtube/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!validateRes.ok) {
        const error = await validateRes.json()
        throw new Error(error.message || "Failed to validate YouTube content")
      }

      setProgressMessage("Starting generation...")

      // 2. Start streaming generation
      const response = await fetch("/api/course-generation/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubeUrl: values.url,
          isPublic: false // Default to private until user chooses otherwise
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to start generation")
      }

      if (!response.body) throw new Error("No response body")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (!line.trim() || !line.startsWith("data: ")) continue

          try {
            const data = JSON.parse(line.replace("data: ", ""))

            if (data.type === "progress" || data.type === "partial") {
              setProgress(data.progress || 0)
              setProgressMessage(data.message || "Generating...")
            } else if (data.type === "complete") {
              setProgress(100)
              setProgressMessage("Finished!")
              router.push(`/analysis/${data.data.courseId}`)
              return
            } else if (data.type === "error") {
              throw new Error(data.error)
            }
          } catch (e) {
            console.error("Error parsing stream line:", e)
          }
        }
      }

    } catch (error) {
      if (error instanceof Error) {
        form.setError("url", {
          type: "manual",
          message: error.message
        })
      } else {
        form.setError("url", {
          type: "manual",
          message: "An unexpected error occurred"
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="contentType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Content Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="video" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Single Video
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="playlist" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Playlist
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="channel" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Channel Content
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>YouTube URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://youtube.com/..." {...field} />
                </FormControl>
                <FormDescription>
                  Enter the URL for your selected content type
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="difficulty"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Difficulty</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select difficulty level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  This helps optimize content organization and assessment generation
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Content...
              </>
            ) : (
              "Generate Course"
            )}
          </Button>
        </form>
      </Form>

      {loading && progress > 0 && (
        <div className="mt-8 border-t pt-8">
          <CourseGenerationProgress
            progress={progress}
            message={progressMessage}
            onCancel={() => setLoading(false)}
          />
        </div>
      )}
    </Card>
  )
}
