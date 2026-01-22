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
  Plus,
  CheckSquare,
  Trash2,
  X,
  Loader2,
  Sparkles
} from "lucide-react"
import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { CourseCard } from "./components/course-card"
import { Course, CourseFilter, CourseCategory } from "./types"
import { CourseGenerationModal } from "@/components/modals/course-generation-modal"
import { useAuth } from "@clerk/nextjs"
import { toast } from "@/components/custom-toast"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { useCategoryUserCourses } from "./hooks/use-category-user-courses"
import { CategoryPills } from "@/components/category-pills"
import { CourseCardSkeleton } from "@/components/ui/course-card-skeleton"
import { AnimatePresence, motion } from "framer-motion"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"

// Filters for course status
const filters: { id: CourseFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in-progress", label: "In Progress" },
  { id: "completed", label: "Completed" },
  { id: "not-started", label: "Not Started" }
]

export default function CoursesPage() {
  console.log('[CoursesPage] Rendering...');

  // State variables
  const [filter, setFilter] = useState<CourseFilter>("all")
  const [search, setSearch] = useState("")
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [sortBy, setSortBy] = useState<"title" | "lastAccessed" | "progress" | "recentlyAdded">("recentlyAdded")
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { userId } = useAuth();
  const router = useRouter()
  const searchParams = useSearchParams()

  // Use our category-based user courses hook with infinite scroll
  const {
    courses: formattedCourses,
    categories: availableCourseCategories,
    loading: isLoadingCourses,
    loadingMore,
    error: coursesError,
    hasMore,
    currentCategory,
    loadMore: loadMoreCourses
  } = useCategoryUserCourses({
    sortBy,
    filter,
    searchQuery: search,
    limit: 12
  })

  useEffect(() => {
    console.log('[CoursesPage] userId:', userId);
    console.log('[CoursesPage] formattedCourses count:', formattedCourses?.length);
    console.log('[CoursesPage] loading:', isLoadingCourses);
    if (coursesError) console.error('[CoursesPage] coursesError:', coursesError);
  }, [userId, formattedCourses, isLoadingCourses, coursesError]);

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedCourses(new Set())
    }
    setSelectionMode(!selectionMode)
  }

  // Handle course selection
  const handleCourseSelection = (courseId: string, selected: boolean) => {
    setSelectedCourses(prevSelected => {
      const newSelected = new Set(prevSelected)
      if (selected) {
        newSelected.add(courseId)
      } else {
        newSelected.delete(courseId)
      }
      return newSelected
    })
  }

  // Handle long press to enter selection mode
  const handleLongPress = (courseId: string) => {
    setSelectionMode(true)
    setSelectedCourses(new Set([courseId]))
  }

  // Convex delete mutation
  const deleteCourseMutation = useMutation(api.courses.deleteCourse);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!userId || selectedCourses.size === 0) return

    try {
      const deletePromises = Array.from(selectedCourses).map(async (courseId) => {
        try {
          await deleteCourseMutation({ courseId: courseId as Id<"courses"> });
          return true;
        } catch (error) {
          console.error(`Error deleting course ${courseId}:`, error);
          return false;
        }
      });

      await Promise.all(deletePromises);
      toast.success("Cleanup completed");

      setSelectionMode(false);
      setSelectedCourses(new Set());
    } catch (error) {
      console.error("Failed to delete courses:", error);
      toast.error("Failed to delete some courses");
    }
  }

  // Select all visible courses
  const selectAllCourses = () => {
    const courseIds = new Set<string>()
    formattedCourses.forEach(course => {
      if (course.isEnrolled) courseIds.add(course.id)
    })
    setSelectedCourses(courseIds)
  }

  // Count of selected enrolled courses
  const selectedCount = selectedCourses.size

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingCourses && !loadingMore && hasMore) {
          loadMoreCourses();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loadMoreCourses, isLoadingCourses, loadingMore, hasMore]);

  // Filter and sort courses based on search and status
  const filteredCourses = useMemo(() => {
    const filtered = formattedCourses.filter(course => {
      // Hook already filters by category, we filter by search and status here
      const matchesSearch = search.toLowerCase().trim() === "" ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = filter === "all" ||
        (filter === "in-progress" && course.progress > 0 && course.progress < 100) ||
        (filter === "completed" && course.progress === 100) ||
        (filter === "not-started" && course.progress === 0);

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title": return a.title.localeCompare(b.title);
        case "lastAccessed": return new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime();
        case "progress": return b.progress - a.progress;
        case "recentlyAdded": return new Date(b.enrolledAt || 0).getTime() - new Date(a.enrolledAt || 0).getTime();
        default: return new Date(b.enrolledAt || 0).getTime() - new Date(a.enrolledAt || 0).getTime();
      }
    });
  }, [formattedCourses, search, filter, sortBy]);

  // Handle course click - navigate to course page
  const handleCourseClick = (courseId: string) => {
    if (!selectionMode) {
      router.push(`/courses/${courseId}`)
    }
  }

  return (
    <div className="h-full">
      {/* Sticky Header */}
      <div className="sticky top-16 z-10 bg-background border-b">
        <div className="mx-auto px-4 max-w-6xl">
          {/* Controls Bar */}
          <div className="h-16 flex items-center justify-between gap-4">
            {selectionMode ? (
              <div className="flex items-center gap-3 w-full">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSelectionMode}>
                  <X className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  <span className="font-medium text-primary">{selectedCount}</span> selected
                </span>
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={selectAllCourses}>
                  Select All
                </Button>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={selectedCount === 0}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            ) : (
              <>
                {/* Left side actions (Filters) */}
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" className="h-10 rounded-full px-4 gap-2 bg-secondary hover:bg-secondary/80 border-none text-foreground">
                        <SlidersHorizontal className="h-4 w-4" />
                        <span>Filters</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                      <DropdownMenuLabel>Filter</DropdownMenuLabel>
                      {filters.map((f) => (
                        <DropdownMenuItem key={f.id} onClick={() => setFilter(f.id)} className={cn(filter === f.id && "bg-muted")}>
                          {f.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Sort</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => setSortBy("recentlyAdded")} className={cn(sortBy === "recentlyAdded" && "bg-muted")}>Recently Added</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("lastAccessed")} className={cn(sortBy === "lastAccessed" && "bg-muted")}>Last Accessed</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("title")} className={cn(sortBy === "title" && "bg-muted")}>Title</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("progress")} className={cn(sortBy === "progress" && "bg-muted")}>Progress</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={toggleSelectionMode}>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Select Multiple
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Centered Search Bar */}
                <div className="flex-1 flex justify-center max-w-2xl px-4">
                  <div className="relative w-full flex items-center">
                    <div className="relative flex-1 group">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input
                        placeholder="Search your library..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-11 pr-16 h-10 w-full bg-background border border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary rounded-l-full rounded-r-none text-base"
                      />
                    </div>
                    <Button
                      variant="secondary"
                      className="h-10 px-5 rounded-r-full rounded-l-none border border-l-0 border-border bg-muted hover:bg-secondary text-muted-foreground"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="default"
                    className="h-10 rounded-full px-4 gap-2 bg-primary hover:bg-primary/90"
                    onClick={() => setShowGenerateModal(true)}
                  >
                    <Plus className="h-5 w-5" />
                    <span className="hidden sm:inline">Generate</span>
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Category Pills */}
          {!selectionMode && availableCourseCategories && availableCourseCategories.length > 0 && (
            <div className="pb-3">
              <CategoryPills
                customCategories={availableCourseCategories.map(cat => ({
                  name: cat.name,
                  slug: cat.slug,
                  courseCount: cat.courseCount
                }))}
                showRecommended={false}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Content */}
      <div className={cn("py-8", selectionMode && "pb-24")}>
        <div className="mx-auto px-4 w-[95%] lg:w-[90%]">
          {isLoadingCourses ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {Array(8).fill(0).map((_, i) => (
                <CourseCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {filteredCourses.length > 0 ? (
                <section>
                  <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    <AnimatePresence mode="popLayout">
                      {filteredCourses.map((course) => (
                        <motion.div
                          key={course.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ duration: 0.2 }}
                        >
                          <CourseCard
                            course={course}
                            onClick={() => handleCourseClick(course.id)}
                            className="h-full"
                            selected={selectedCourses.has(course.id)}
                            onSelect={handleCourseSelection}
                            selectionMode={selectionMode}
                            onLongPress={handleLongPress}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  <div ref={loadMoreRef} className="py-12 flex justify-center">
                    {loadingMore && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
                    {!hasMore && filteredCourses.length > 0 && (
                      <p className="text-sm text-muted-foreground">End of your library</p>
                    )}
                  </div>
                </section>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in slide-in-from-bottom-4">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-150 animate-pulse" />
                    <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-full p-8 border border-primary/20">
                      <Plus className="h-12 w-12 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 tracking-tight">Your library is waiting</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-10 leading-relaxed">
                    {search
                      ? `We couldn't find any courses matching "${search}". Try adjusting your filters or search term.`
                      : "Start your learning journey today. Transform any YouTube video into a structured, AI-powered course in seconds."}
                  </p>
                  <Button
                    onClick={() => setShowGenerateModal(true)}
                    size="lg"
                    className="rounded-full px-10 py-6 h-auto text-base font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                  >
                    <Plus className="h-5 w-5 mr-3" />
                    Create Your First Course
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Selection Bar */}
      {selectionMode && selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-6 animate-in slide-in-from-bottom-8">
          <span className="font-medium text-sm whitespace-nowrap">{selectedCount} items selected</span>
          <div className="h-4 w-px bg-background/20" />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={toggleSelectionMode} className="hover:bg-background/10 text-background">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="shadow-lg">
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <CourseGenerationModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  )
}
