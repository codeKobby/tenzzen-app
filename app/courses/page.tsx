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
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useState, useMemo, useRef, useEffect } from "react"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { CourseCard } from "./components/course-card"
import { CourseDialog } from "./components/course-dialog"
import { Course, CourseFilter, CourseCategory } from "./types"
import { sampleCourses } from "./data"

const filters: { id: CourseFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "not-started", label: "Not Started" }
]

const categories: { id: CourseCategory; label: string }[] = [
  { id: "all", label: "All" },
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
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current
        const hasOverflow = scrollWidth > clientWidth
        setShowScrollButtons(hasOverflow)
        setCanScrollLeft(scrollLeft > 0)
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth)
      }
    }

    checkScroll()
    window.addEventListener('resize', checkScroll)

    if (scrollContainerRef.current) {
      scrollContainerRef.current.addEventListener('scroll', checkScroll)
    }

    return () => {
      window.removeEventListener('resize', checkScroll)
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener('scroll', checkScroll)
      }
    }
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      const targetScroll = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  const sortedAndFilteredCourses = useMemo(() => {
    const filtered = sampleCourses.filter((course: Course) => {
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

    return [...filtered].sort((a: Course, b: Course) => {
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

  const inProgressCourses = useMemo(() => 
    sortedAndFilteredCourses.filter((c: Course) => c.progress > 0 && c.progress < 100)
  , [sortedAndFilteredCourses])

  const otherCourses = useMemo(() => 
    sortedAndFilteredCourses.filter((c: Course) => c.progress === 0 || c.progress === 100)
  , [sortedAndFilteredCourses])

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-background">
        {/* Search and Sort */}
        <div className={cn(
          "mx-auto h-14 flex items-center gap-4 px-4",
          useSidebar().isOpen ? "lg:w-[95%]" : "lg:w-[90%]"
        )}>
          <div className="relative flex-1 max-w-[600px] flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full h-8 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <Select
              value={filter}
              onValueChange={(value: CourseFilter) => setFilter(value)}
            >
              <SelectTrigger className="w-[130px] h-8 bg-transparent">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {filters.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="hidden sm:block">
            <Select
              value={sortBy}
              onValueChange={(value: "title" | "lastAccessed" | "progress") => setSortBy(value)}
            >
              <SelectTrigger className="w-[130px] h-8 bg-transparent">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastAccessed">Last Accessed</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="relative border-t">
          <div className={cn(
            "mx-auto px-4 overflow-hidden",
            useSidebar().isOpen ? "lg:w-[95%]" : "lg:w-[90%]"
          )}>
            <div className="relative py-3">
              <div
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-hidden scroll-smooth"
              >
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={category === cat.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setCategory(cat.id)}
                    className={cn(
                      "h-8 rounded-lg font-normal transition-all whitespace-nowrap",
                      category === cat.id 
                        ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                        : "hover:bg-secondary"
                    )}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>

              {/* Navigation Arrows */}
              {showScrollButtons && (
                <>
                  {canScrollLeft && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md"
                      onClick={() => scroll('left')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {canScrollRight && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md"
                      onClick={() => scroll('right')}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className={cn(
        "mx-auto px-4 py-6 space-y-6",
        useSidebar().isOpen ? "lg:w-[95%]" : "lg:w-[90%]"
      )}>
        {sortedAndFilteredCourses.length > 0 ? (
          <div className="space-y-6">
            {/* Continue Learning Section */}
            {inProgressCourses.length > 0 && (
              <section>
                <h2 className="font-medium text-lg mb-4">Continue Learning</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {inProgressCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onClick={() => setSelectedCourse(course)}
                      className="animate-in fade-in-50 duration-500"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Other Courses Section */}
            {otherCourses.length > 0 && (
              <section>
                <h2 className="font-medium text-lg mb-4">
                  {filter === "completed" ? "Completed" :
                    filter === "not-started" ? "Start Learning" :
                      "All Courses"}
                </h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {otherCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onClick={() => setSelectedCourse(course)}
                      className="animate-in fade-in-50 duration-500"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {search
                ? `No courses match "${search}"`
                : "No courses found"}
            </p>
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
