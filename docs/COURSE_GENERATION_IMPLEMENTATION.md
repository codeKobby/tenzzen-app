# Course Generation Implementation with shadcn

## Overview

The course generation interface provides options to create courses from YouTube content or topics using shadcn components.

## Key Components Used

- Dialog
- Tabs
- Form
- Input
- Select
- Textarea
- Button
- RadioGroup
- Card

## Implementation

```tsx
// app/components/course-generation-dialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Youtube, Book, ArrowRight } from "lucide-react"

interface CourseGenerationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseGenerationDialog({
  open,
  onOpenChange
}: CourseGenerationDialogProps) {
  const form = useForm<CourseGenerationData>()
  const [activeTab, setActiveTab] = useState<"youtube" | "topic">("youtube")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate New Course</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "youtube" | "topic")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="youtube" className="flex items-center gap-2">
              <Youtube className="h-4 w-4" />
              YouTube Link
            </TabsTrigger>
            <TabsTrigger value="topic" className="flex items-center gap-2">
              <Book className="h-4 w-4" />
              Topic Request
            </TabsTrigger>
          </TabsList>

          <TabsContent value="youtube">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="youtubeUrl"
                  rules={{ required: "YouTube URL is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube Video or Playlist URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://youtube.com/..."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your skill level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">
                    Generate Course
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="topic">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="topic"
                  rules={{ required: "Topic is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What would you like to learn?</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Learn Python for Data Science"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredChannels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Preferred YouTube Channels (optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., freeCodeCamp, Traversy Media"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Skill Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your skill level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="learningGoals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Learning Goals (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What specific skills or concepts would you like to master?"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit">
                    Generate Course
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
```

## Features

1. **Input Methods**
   - YouTube URL input
   - Topic-based generation
   - Channel preferences
   - Skill level selection

2. **Form Features**
   - Field validation
   - Optional inputs
   - Proper labeling
   - Clear placeholders

3. **User Experience**
   - Tabbed interface
   - Form progression
   - Loading states
   - Error handling

4. **Visual Elements**
   - Icon integration
   - Tab indicators
   - Form spacing
   - Button states

## Usage Example

```tsx
// In your explore page
export default function ExplorePage() {
  const [showGeneration, setShowGeneration] = useState(false)

  return (
    <div>
      <Button onClick={() => setShowGeneration(true)}>
        Create New Course
      </Button>

      <CourseGenerationDialog
        open={showGeneration}
        onOpenChange={setShowGeneration}
      />
    </div>
  )
}
```

## Loading State

```tsx
// Course generation loading state
function GeneratingCourse() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-lg font-medium">
        Generating your course...
      </p>
      <p className="text-sm text-muted-foreground">
        Our AI is analyzing the content and structuring your learning path
      </p>
    </div>
  )
}
```

This implementation provides a user-friendly course generation interface using shadcn components while maintaining form validation and proper state management.