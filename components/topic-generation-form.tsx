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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  topic: z.string().min(10, "Please provide a detailed topic description"),
  learningGoal: z.string().min(10, "Please describe your learning goals"),
  knowledgeLevel: z.enum(["beginner", "intermediate", "advanced"]),
  preferredChannels: z.string().optional(),
  includeProjects: z.boolean().default(true),
  includeAssessments: z.boolean().default(true),
  estimatedDuration: z.enum(["short", "medium", "long"]),
})

export function TopicGenerationForm() {
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      includeProjects: true,
      includeAssessments: true,
      estimatedDuration: "medium",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      // TODO: Implement topic-based course generation logic
      console.log(values)
    } catch (error) {
      console.error(error)
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
            name="topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the topic you want to learn about..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Be specific about what aspects of the topic interest you
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="learningGoal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Learning Goals</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What do you want to achieve by learning this topic?"
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Define clear objectives for your learning journey
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="knowledgeLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current Knowledge Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your knowledge level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  This helps tailor the content to your experience level
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredChannels"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Channels (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter YouTube channel names, comma separated"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Specify preferred content creators for your course
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="includeProjects"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Include Projects</FormLabel>
                    <FormDescription>
                      Add hands-on projects with GitHub integration
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeAssessments"
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Include Assessments</FormLabel>
                    <FormDescription>
                      Add quizzes and knowledge checks throughout the course
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="estimatedDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Duration</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course length" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="short">Short (2-4 hours)</SelectItem>
                    <SelectItem value="medium">Medium (4-8 hours)</SelectItem>
                    <SelectItem value="long">Long (8+ hours)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose your preferred course length
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Course...
              </>
            ) : (
              "Generate Course"
            )}
          </Button>
        </form>
      </Form>
    </Card>
  )
}
