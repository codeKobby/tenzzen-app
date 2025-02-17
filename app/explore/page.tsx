"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Folder,
  Users,
  Plus,
  Search,
  Star,
  Clock,
  GraduationCap
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Course, CourseCategory, CourseFilter } from "@/app/courses/types"
import { sampleCourses } from "@/app/courses/data"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Link from "next/link"
import { CourseCard } from "@/app/courses/components/course-card"
import { CourseDialog } from "@/app/courses/components/course-dialog"

export default function ExplorePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [filter, setFilter] = useState<CourseFilter>("all")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<CourseCategory>("all")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [showAuthPrompt, setShowAuthPrompt] = useState(false)

  const categories: { label: string; value: CourseCategory }[] = [
    { label: "All Categories", value: "all" },
    { label: "Programming", value: "programming" },
    { label: "Design", value: "design" },
    { label: "Business", value: "business" },
  ]

  const filtersData = [
    { id: "all", label: "All Courses" },
    { id: "in-progress", label: "In Progress" },
    { id: "completed", label: "Completed" },
    { id: "not-started", label: "Not Started" },
  ]

  const filteredCourses = sampleCourses.filter(course => {
    const matchesCategory = category === "all" || course.category.toLowerCase() === category.toLowerCase()

    const matchesFilter = filter === "all" ||
      (filter === "in-progress" && course.progress > 0 && course.progress < 100) ||
      (filter === "completed" && course.progress === 100) ||
      (filter === "not-started" && course.progress === 0)

    const matchesSearch = search.toLowerCase().trim() === "" ||
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase())


    return matchesSearch && matchesCategory && matchesFilter
  })


  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Explore Courses</h1>
            <p className="text-muted-foreground">
              Discover new learning opportunities
            </p>
          </div>
          <Button onClick={() => user ? router.push('/generate') : setShowAuthPrompt(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-[300px]">
            <Search className="absolute h-4 w-4 text-muted-foreground left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex gap-4">
            <Select value={category} onValueChange={(value) => setCategory(value as CourseCategory)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {filtersData.map((f) => (
                <Button
                  key={f.id}
                  variant={filter === f.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.id as CourseFilter)}
                >
                  {f.label}
                  <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-xs">
                    {filteredCourses.filter(course =>
                      f.id === "all" ? true :
                      f.id === "in-progress" ? (course.progress > 0 && course.progress < 100) :
                      f.id === "completed" ? course.progress === 100 :
                      course.progress === 0
                    ).length}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => setSelectedCourse(course)}
            />
          ))}
        </div>

        {/* Course Preview Dialog */}
        <CourseDialog
          course={selectedCourse}
          open={!!selectedCourse}
          onOpenChange={(open) => !open && setSelectedCourse(null)}
        />

        <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sign in to Tenzzen</DialogTitle>
              <DialogDescription>
                Sign in to create and access more courses.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <Button asChild>
                <Link href="/signin">
                  Sign In
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/signup">
                  Create an Account
                </Link>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}