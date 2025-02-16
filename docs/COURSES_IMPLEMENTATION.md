# Courses Page Implementation with shadcn

## Overview

The courses page provides a comprehensive view of user's courses with filtering, search, and course management capabilities using shadcn components.

## Key Components Used

- Card
- Button
- Input
- Badge
- Dialog
- ScrollArea
- Separator
- Progress

## Implementation

```tsx
// app/(dashboard)/courses/page.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { PlusCircle, BookOpen, Search } from "lucide-react"
import { CourseCard } from "./components/course-card"
import { CourseDialog } from "./components/course-dialog"

interface Course {
  id: string
  title: string
  description: string
  duration: string
  progress: number
  rating: number
  instructor: string
  category: string
  thumbnail?: string
  lastAccessed?: string
  totalLessons?: number
  completedLessons?: number
}

export default function CoursesPage() {
  const [filter, setFilter] = useState<
    "all" | "in-progress" | "completed" | "not-started"
  >("all")
  const [search, setSearch] = useState("")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

  return (
    <div className="container space-y-8 py-8">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground">
            Continue learning where you left off
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Browse Courses
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.id}
              variant={filter === f.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.id)}
            >
              {f.label}
              <Badge
                variant="secondary"
                className="ml-2 bg-background/50 px-1.5"
              >
                {getFilterCount(f.id, courses)}
              </Badge>
            </Button>
          ))}
        </div>
        <div className="w-full sm:w-[300px]">
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
            icon={<Search className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Course Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={() => setSelectedCourse(course)}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredCourses.length === 0 && (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="mt-4 text-lg font-semibold">No courses found</h3>
            <p className="mb-4 mt-2 text-sm text-muted-foreground">
              {search
                ? `No courses match "${search}"`
                : "You haven't enrolled in any courses yet"}
            </p>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Browse Courses
            </Button>
          </div>
        </div>
      )}

      {/* Course Dialog */}
      <CourseDialog
        course={selectedCourse}
        open={!!selectedCourse}
        onOpenChange={() => setSelectedCourse(null)}
      />
    </div>
  )
}

// app/(dashboard)/courses/components/course-card.tsx
interface CourseCardProps {
  course: Course
  onClick?: () => void
}

export function CourseCard({ course, onClick }: CourseCardProps) {
  return (
    <Card className="overflow-hidden" onClick={onClick}>
      <div className="aspect-video relative">
        <Image
          src={course.thumbnail || "/course-placeholder.jpg"}
          alt={course.title}
          fill
          className="object-cover"
        />
      </div>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{course.category}</Badge>
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            {course.duration}
          </div>
        </div>
        <h3 className="text-lg font-semibold leading-none tracking-tight">
          {course.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {course.description}
        </p>
      </CardHeader>
      <CardContent className="grid gap-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span>{course.progress}%</span>
          </div>
          <Progress value={course.progress} />
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <div className="flex items-center text-sm text-muted-foreground">
          <UserCircle className="mr-1 h-4 w-4" />
          {course.instructor}
        </div>
        {course.lastAccessed && (
          <div className="text-sm text-muted-foreground">
            Last accessed {course.lastAccessed}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

// app/(dashboard)/courses/components/course-dialog.tsx
interface CourseDialogProps {
  course: Course | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CourseDialog({ course, open, onOpenChange }: CourseDialogProps) {
  if (!course) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{course.title}</DialogTitle>
          <DialogDescription>
            {course.description}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {/* Course Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Lessons
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {course.totalLessons}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {course.completedLessons}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>Course Progress</span>
              <span>{course.progress}%</span>
            </div>
            <Progress value={course.progress} className="h-2" />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Close
          </Button>
          <Button>Continue Learning</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Features

1. **Course Management**
   - Course listing and grid view
   - Progress tracking
   - Course details modal
   - Course filtering and search

2. **Visual Components**
   - Course cards with thumbnails
   - Progress indicators
   - Category badges
   - Status indicators

3. **Interactive Elements**
   - Filter buttons
   - Search functionality
   - Course details dialog
   - Continue learning button

4. **Responsive Design**
   - Grid layout adaptation
   - Mobile-friendly filters
   - Responsive card sizing
   - Adaptive spacing

## Usage Examples

### Course Filtering
```tsx
const filters = [
  { id: "all", label: "All Courses" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "not-started", label: "Not Started" },
]

function getFilterCount(filter: string, courses: Course[]) {
  switch (filter) {
    case "in-progress":
      return courses.filter(c => c.progress > 0 && c.progress < 100).length
    case "completed":
      return courses.filter(c => c.progress === 100).length
    case "not-started":
      return courses.filter(c => c.progress === 0).length
    default:
      return courses.length
  }
}
```

### Course Search
```tsx
const filteredCourses = courses.filter(course => {
  const matchesSearch = search.toLowerCase().trim() === "" 
    ? true 
    : course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase())

  const matchesFilter = filter === "all"
    ? true
    : filter === "in-progress"
    ? course.progress > 0 && course.progress < 100
    : filter === "completed"
    ? course.progress === 100
    : course.progress === 0

  return matchesSearch && matchesFilter
})
```

This implementation provides a modern, interactive course management interface using shadcn components while maintaining consistency with the application's design system.