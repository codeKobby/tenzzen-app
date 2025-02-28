"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react"
import { useState, useMemo, useRef, useEffect } from "react"
import { useSidebar } from "@/hooks/use-sidebar"
import { cn } from "@/lib/utils"
import { CourseCard } from "./components/course-card"
import { CourseDialog } from "./components/course-dialog"
import { Course, CourseFilter, CourseCategory } from "./types"
import { sampleCourses } from "./data"
import { CourseGenerationModal } from "../explore/components/course-generation-modal"

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
  const [showGenerateModal, setShowGenerateModal] = useState(false)
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

  const sortedAndFilteredCourses = useMemo((): Course[] => {
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

  const inProgressCourses = useMemo((): Course[] =>
    sortedAndFilteredCourses.filter((c) => c.progress > 0 && c.progress < 100)
    , [sortedAndFilteredCourses])

  const otherCourses = useMemo((): Course[] =>
    sortedAndFilteredCourses.filter((c) => c.progress === 0 || c.progress === 100)
    , [sortedAndFilteredCourses])

  return (
    <div className="h-full">
      {/* Fixed Header */}
      <div className="sticky top-16 z-10 bg-background ">
        <div className={cn(
          "w-full mx-auto px-4",
          "duration-300",
          "w-[95%] lg:w-[90%]"
        )}>
          {/* Search and Sort */}
          <div className="h-14 flex items-center gap-2 sm:gap-4 justify-between">
            <div className="flex items-center gap-2 sm:gap-4 w-full">
              <div className="flex gap-2 flex-1 max-w-[600px]">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search courses..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-full h-8 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                    {filters.map((f) => (
                      <DropdownMenuItem
                        key={f.id}
                        onClick={() => setFilter(f.id)}
                        className={cn(
                          "cursor-pointer",
                          filter === f.id && "bg-muted"
                        )}
                      >
                        {f.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => setSortBy("lastAccessed")}
                      className={cn(
                        "cursor-pointer",
                        sortBy === "lastAccessed" && "bg-muted"
                      )}
                    >
                      Last Accessed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("title")}
                      className={cn(
                        "cursor-pointer",
                        sortBy === "title" && "bg-muted"
                      )}
                    >
                      Title
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setSortBy("progress")}
                      className={cn(
                        "cursor-pointer",
                        sortBy === "progress" && "bg-muted"
                      )}
                    >
                      Progress
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

              </div>

              <Button
                variant="secondary"
                size="sm"
                className="h-8"
                onClick={() => window.location.href = '/explore'}
              >
                Explore
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-8"
                onClick={() => setShowGenerateModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Generate
              </Button>
            </div>
          </div>

          {/* Category Pills */}
          <div className="relative">
            <div className="overflow-hidden">
              <div className="relative py-2 sm:py-3">
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
      </div>

      {/* Main Content */}
      <div className="py-8">
        <div className={cn(
          "w-full mx-auto px-4 space-y-6",
          "duration-300",
          "w-[95%] lg:w-[90%]"
        )}>
          {sortedAndFilteredCourses.length > 0 ? (
            <div className="space-y-8">
              {/* Continue Learning Section */}
              {inProgressCourses.length > 0 && (
                <section>
                  <h2 className="font-medium text-lg mb-4">Continue Learning</h2>
                  <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
                    {inProgressCourses.map((course: Course) => (
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
                  <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
                    {otherCourses.map((course: Course) => (
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
        </div>
      </div>

      {/* Course Dialog */}
      <CourseDialog
        course={selectedCourse}
        open={!!selectedCourse}
        onOpenChange={(open) => !open && setSelectedCourse(null)}
      />

      {/* Course Generation Modal */}
      <CourseGenerationModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  )
}
