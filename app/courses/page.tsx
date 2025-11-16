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
  Loader2
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
import { useUserCourses } from "./hooks/use-user-courses"
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

// Fallback categories in case database categories aren't available
const fallbackCategories: { id: CourseCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "programming", label: "Programming" },
  { id: "design", label: "Design" },
  { id: "business", label: "Business" }
]

export default function CoursesPage() {
  // State variables
  const [filter, setFilter] = useState<CourseFilter>("all")
  const [search, setSearch] = useState("")
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [sortBy, setSortBy] = useState<"title" | "lastAccessed" | "progress" | "recentlyAdded">("recentlyAdded")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const { userId } = useAuth();
  const router = useRouter()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') as CourseCategory || 'all'

  // Function to trigger a refresh of courses
  const refreshCourses = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Use our category-based user courses hook with infinite scroll
  const {
    courses: formattedCourses,
    recentCourses: formattedRecentCourses,
    categories: availableCourseCategories,
    loading: isLoadingCourses,
    loadingMore,
    error: coursesError,
    totalCount,
    hasMore,
    currentCategory,
    loadMore: loadMoreCourses
  } = useCategoryUserCourses({
    sortBy,
    filter,
    searchQuery: search,
    limit: 12
  })

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (selectionMode) {
      // Clear selections when exiting selection mode
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
  const deleteCourse = useMutation(api.courses.deleteCourse);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!userId || selectedCourses.size === 0) return

    try {
      // Delete each selected course
      let deleteCount = 0;
      const deletePromises = Array.from(selectedCourses).map(async (courseId) => {
        try {
          console.log(`Deleting course ${courseId}`);
          await deleteCourse({ courseId: courseId as Id<"courses"> });
          deleteCount++;
          return true;
        } catch (error) {
          console.error(`Error deleting course ${courseId}:`, error);
          return false;
        }
      });

      // Wait for all delete operations to complete
      await Promise.all(deletePromises);

      // Show success message
      toast.success(
        deleteCount === 1
          ? "Course deleted successfully"
          : `${deleteCount} courses deleted successfully`
      );

      // Exit selection mode - Convex will automatically update the list
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

    // Add course IDs from all visible courses
    formattedCourses.forEach(course => {
      if (course.isEnrolled) courseIds.add(course.id)
    })

    setSelectedCourses(courseIds)
  }

  // Count of selected enrolled courses
  const selectedCount = selectedCourses.size

  // Show error toast if there's an error loading courses
  useEffect(() => {
    if (coursesError) {
      // Use setTimeout to avoid React state updates during rendering
      setTimeout(() => {
        toast.error("Failed to load courses");
      }, 0);
    }
  }, [coursesError]);

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

  // No longer need scroll logic as CategoryPills component handles scrolling internally

  // Filter and sort courses based on search, category, and filter
  const filteredCourses = useMemo(() => {
    // Log current state for debugging
    console.log(`Filtering courses: ${formattedCourses.length} courses, category: ${currentCategory}, filter: ${filter}`);

    const filtered = formattedCourses.filter(course => {
      // Skip courses that aren't enrolled for "in-progress" and "completed" filters
      if ((filter === "in-progress" || filter === "completed") && !course.isEnrolled) {
        return false;
      }

      const matchesSearch = search.toLowerCase().trim() === "" ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase());

      // Category filtering is now handled by the hook directly
      const matchesCategory = true;

      const matchesFilter = filter === "all" ||
        (filter === "in-progress" && course.progress > 0 && course.progress < 100) ||
        (filter === "completed" && course.progress === 100) ||
        (filter === "not-started" && course.progress === 0);

      return matchesSearch && matchesCategory && matchesFilter;
    });

    console.log(`After filtering: ${filtered.length} courses match criteria`);

    // Sort filtered courses
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "lastAccessed":
          return new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime();
        case "progress":
          return b.progress - a.progress;
        case "recentlyAdded":
          return new Date(b.enrolledAt || 0).getTime() - new Date(a.enrolledAt || 0).getTime();
        default:
          // Default to recently added
          return new Date(b.enrolledAt || 0).getTime() - new Date(a.enrolledAt || 0).getTime();
      }
    });
  }, [formattedCourses, search, currentCategory, filter, sortBy]);

  // No longer need to create category pills manually as we're using the CategoryPills component

  // Handle course click - navigate to course page
  const handleCourseClick = (courseId: string) => {
    if (!selectionMode) {
      router.push(`/courses/${courseId}`)
    }
  }

  return (
    <div className="h-full">
      {/* Fixed Header */}
      <div className="sticky top-16 z-10 bg-background">
        <div className={cn(
          "w-full mx-auto px-4",
          "duration-300",
          "w-[95%] lg:w-[90%]"
        )}>
          {/* Search and Sort */}
          <div className="h-14 flex items-center gap-2 sm:gap-4 justify-between">
            {/* Selection mode header */}
            {selectionMode ? (
              <div className="flex items-center gap-3 w-full">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={toggleSelectionMode}
                  aria-label="Exit selection mode"
                >
                  <X className="h-4 w-4" />
                </Button>
                {selectedCount > 0 ? (
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-primary">{selectedCount}</span>
                    <span className="text-muted-foreground">selected</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select courses</span>
                )}
                <div className="flex-1" />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={selectAllCourses}
                  disabled={formattedCourses.filter(c => c.isEnrolled).length === 0}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Select All
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8"
                  onClick={handleBulkDelete}
                  disabled={selectedCount === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            ) : (
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
                          )}>
                          {f.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() => setSortBy("recentlyAdded")}
                        className={cn(
                          "cursor-pointer",
                          sortBy === "recentlyAdded" && "bg-muted"
                        )}>
                        Recently Added
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortBy("lastAccessed")}
                        className={cn(
                          "cursor-pointer",
                          sortBy === "lastAccessed" && "bg-muted"
                        )}>
                        Last Accessed
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortBy("title")}
                        className={cn(
                          "cursor-pointer",
                          sortBy === "title" && "bg-muted"
                        )}>
                        Title
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSortBy("progress")}
                        className={cn(
                          "cursor-pointer",
                          sortBy === "progress" && "bg-muted"
                        )}>
                        Progress
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={toggleSelectionMode}
                  title="Select courses"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Select</span>
                </Button>

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
            )}
          </div>

          {/* Category Pills - Only show when not in selection mode */}
          {!selectionMode && availableCourseCategories && availableCourseCategories.length > 0 && (
            <div className="py-2 sm:py-3">
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

      {/* Main Content */}
      <div className={cn("py-8", selectionMode && "pb-20")}>
        <div className={cn(
          "w-full mx-auto px-4 space-y-8",
          "duration-300",
          "w-[95%] lg:w-[90%]"
        )}>
          {/* Loading state */}
          {isLoadingCourses ? (
            <div className="space-y-6">
              {/* Skeleton loading state - reduced to 1-2 rows (4-8 cards) */}
              <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
                {Array(8).fill(0).slice(0, 8).map((_, index) => (
                  <CourseCardSkeleton key={index} className={cn(
                    // Only show 1-2 rows based on screen size
                    index >= 4 && "hidden 2xl:block", // Show 8 on 2xl screens (2 rows of 4)
                    index >= 3 && "hidden lg:block 2xl:block", // Show 6 on lg screens (2 rows of 3)
                    index >= 2 && "hidden sm:block lg:block 2xl:block", // Show 4 on sm screens (2 rows of 2)
                  )} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* All Courses Section - auto sorted by recently added */}
              {filteredCourses.length > 0 && (
                <section>
                  <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
                    <AnimatePresence mode="sync">
                      {filteredCourses.map((course) => (
                        <motion.div
                          key={course.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{
                            opacity: { duration: 0.2 },
                            layout: { duration: 0.3, type: "spring" }
                          }}
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
                  <div ref={loadMoreRef} className="py-8 flex justify-center">
                    {loadingMore ? (
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    ) : hasMore ? (
                      <div className="h-8" />
                    ) : (
                      <p className="text-sm text-muted-foreground">No more courses to load</p>
                    )}
                  </div>
                </section>
              )}

              {/* Enhanced empty state - show prominently when no courses */}
              {!isLoadingCourses && filteredCourses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="bg-muted/40 rounded-xl p-8 max-w-md w-full">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <Image
                        src="/illustrations/empty-courses.svg"
                        alt="No courses"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No courses yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      {search
                        ? `No courses match "${search}"`
                        : "Get started by generating your first course from YouTube videos or other content."}
                    </p>
                    <Button
                      onClick={() => setShowGenerateModal(true)}
                      size="lg"
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Generate Your First Course
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Selection action bar - fixed at the bottom when in selection mode */}
      {selectionMode && selectedCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-background border-t p-3 z-40 shadow-lg animate-in slide-in-from-bottom">
          <div className={cn(
            "w-full mx-auto flex items-center justify-between",
            "duration-300 gap-4",
            "w-[95%] lg:w-[90%]"
          )}>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span className="font-medium">{selectedCount} selected</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectionMode}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Course Generation Modal */}
      <CourseGenerationModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
      />
    </div>
  )
}
