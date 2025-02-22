"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PlusCircle,
  BookOpen,
  Search,
} from "lucide-react"
import { useState, useMemo } from "react"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { CourseCard } from "./components/course-card"
import { CourseDialog } from "./components/course-dialog"
import { Course, CourseFilter, CourseCategory } from "./types"
import { sampleCourses } from "./data"

const filters: { id: CourseFilter; label: string }[] = [
  { id: "all", label: "All Courses" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "not-started", label: "Not Started" }
]

const categories: { id: CourseCategory; label: string }[] = [
  { id: "all", label: "All Categories" },
  { id: "programming", label: "Programming" },
  { id: "design", label: "Design" },
  { id: "business", label: "Business" }
]

export default function CoursesPage() {
  const [filter, setFilter] = useState<CourseFilter>("all")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<CourseCategory>("all")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [sortBy, setSortBy] = useState<"title" | "lastAccessed" | "progress">("lastAccessed")

  const sortedAndFilteredCourses = useMemo(() => {
    const filtered = sampleCourses.filter(course => {
      const matchesSearch = search.toLowerCase().trim() === "" ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase())
      
      const matchesCategory = category === "all" || 
        course.category.toLowerCase() === category.toLowerCase()
      
      const matchesFilter = filter === "all" ||
        (filter === "in-progress" && course.progress > 0 && course.progress < 100) ||
        (filter === "completed" && course.progress === 100) ||
        (filter === "not-started" && course.progress === 0)

      return matchesSearch && matchesCategory && matchesFilter
    })

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title)
        case "lastAccessed":
          return new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime()
        case "progress":
          return b.progress - a.progress
        default:
          return 0
      }
    })
  }, [search, category, filter, sortBy])

  return (
    <div className="min-h-screen bg-background py-6">
      <div className={cn(
        "mx-auto space-y-6 transition-all duration-300",
        useSidebar().isOpen 
          ? "w-[95%]" 
          : "w-[90%]"
      )}>
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-medium tracking-tight">My Courses</h1>
            <p className="text-sm text-muted-foreground">
              Continue learning where you left off
            </p>
          </div>
          <Button size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Browse Courses
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 sm:flex-row flex-wrap sm:items-center">
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <Button
                key={f.id}
                variant={filter === f.id ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f.id)}
              >
                {f.label}
                <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">
                  {sortedAndFilteredCourses.filter(course => 
                    f.id === "all" ? true :
                    f.id === "in-progress" ? (course.progress > 0 && course.progress < 100) :
                    f.id === "completed" ? course.progress === 100 :
                    course.progress === 0
                  ).length}
                </span>
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 sm:ml-auto">
            <div className="flex gap-4">
              <Select
                value={sortBy}
                onValueChange={(value: "title" | "lastAccessed" | "progress") => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastAccessed">Last Accessed</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={category}
                onValueChange={(value: CourseCategory) => setCategory(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full sm:w-[300px]"
              />
            </div>
          </div>
        </div>

        {/* Course Grid */}
        {sortedAndFilteredCourses.length > 0 ? (
          <div className="grid gap-x-4 gap-y-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {sortedAndFilteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => setSelectedCourse(course)}
              />
            ))}
          </div>
        ) : (
          <div className="col-span-full flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in-50">
          <div className="mx-auto flex max-w-[600px] flex-col items-center justify-center text-center">
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
          onOpenChange={(open) => !open && setSelectedCourse(null)}
        />
      </div>
    </div>
  )
}
