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
  Plus,
  CheckSquare,
  Trash2,
  X,
  Loader2
} from "lucide-react"
import { useState, useMemo, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { CourseCard } from "./components/course-card"
import { Course, CourseFilter, CourseCategory } from "./types"
import { sampleCourses } from "./data"
import { CourseGenerationModal } from "@/components/modals/course-generation-modal"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { getLocalEnrollments, getUserEnrollments, getRecentEnrollments, deleteUserEnrollment } from "@/lib/local-storage"
import { formatEnrollmentToCourse } from "@/lib/course-utils"
import Image from "next/image"
import { useRouter } from "next/navigation"

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
  const [category, setCategory] = useState<CourseCategory>("all")
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [sortBy, setSortBy] = useState<"title" | "lastAccessed" | "progress">("lastAccessed")
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [formattedCourses, setFormattedCourses] = useState<Course[]>([])
  const [formattedRecentCourses, setFormattedRecentCourses] = useState<Course[]>([])

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { userId } = useAuth();
  const router = useRouter()

  // Fetch categories from the database
  const dbCategories = useQuery(api.categories.getPopularCategories, {
    limit: 10
  });

  // Refresh trigger to reload courses when needed (like after deletion)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to trigger a refresh of courses
  const refreshCourses = () => {
    setRefreshTrigger(prev => prev + 1)
  }

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

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!userId || selectedCourses.size === 0) return

    try {
      // Delete each selected course
      let deleteCount = 0
      selectedCourses.forEach(courseId => {
        deleteUserEnrollment(userId as string, courseId)
        deleteCount++
      })

      // Show success message
      toast.success(
        deleteCount === 1
          ? "Course deleted successfully"
          : `${deleteCount} courses deleted successfully`
      )

      // Exit selection mode and refresh data
      setSelectionMode(false)
      setSelectedCourses(new Set())
      refreshCourses()

    } catch (error) {
      console.error("Failed to delete courses:", error)
      toast.error("Failed to delete some courses")
    }
  }

  // Select all visible courses
  const selectAllCourses = () => {
    const courseIds = new Set<string>()

    // Add course IDs from all visible sections
    if (formattedRecentCourses.length > 0) {
      formattedRecentCourses.forEach(course => {
        if (course.isEnrolled) courseIds.add(course.id)
      })
    }

    if (inProgressCourses.length > 0) {
      inProgressCourses.forEach(course => courseIds.add(course.id))
    }

    if (otherCourses.length > 0) {
      otherCourses.forEach(course => {
        if (course.isEnrolled) courseIds.add(course.id)
      })
    }

    setSelectedCourses(courseIds)
  }

  // Count of selected enrolled courses
  const selectedCount = selectedCourses.size

  // Load courses from API or localStorage
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);

      try {
        // Check if we have userId
        if (typeof window !== 'undefined' && userId) {
          // Get user enrollments from API with localStorage fallback
          // const userEnrollments = await safelyGetUserEnrollments(userId, false);
          // Fallback: show empty state or use getUserEnrollments if needed

          const userEnrollments: any[] = []; // No API-wrapper fallback

          if (userEnrollments.length > 0) {
            console.log("User enrollments found:", userEnrollments.length);

            // Format recent courses from enrollments
            const recentEnrollments = userEnrollments
              .sort((a, b) => b.enrolledAt - a.enrolledAt)
              .slice(0, 2);

            const recentCourses = recentEnrollments.map(enrollment =>
              formatEnrollmentToCourse(enrollment)
            );

            setFormattedRecentCourses(recentCourses);

            // Format all courses from enrollments
            const allCourses = userEnrollments.map(enrollment =>
              formatEnrollmentToCourse(enrollment)
            );

            setFormattedCourses(allCourses);
          } else {
            // No user enrollments, show empty state
            console.log("No user enrollments found");
            setFormattedCourses([]);
            setFormattedRecentCourses([]);
          }
        } else {
          // Not logged in or SSR, show empty state
          setFormattedCourses([]);
          setFormattedRecentCourses([]);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
        toast.error("Failed to load courses");
        setFormattedCourses([]);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [userId, refreshTrigger]);

  // Scroll logic
  useEffect(() => {
    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = scrollContainerRef.current;
        const hasOverflow = scrollWidth > clientWidth;
        setShowScrollButtons(hasOverflow);
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth);
      }
    };

    checkScroll();
    window.addEventListener('resize', checkScroll);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.addEventListener('scroll', checkScroll);
    }

    return () => {
      window.removeEventListener('resize', checkScroll);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.removeEventListener('scroll', checkScroll);
      }
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const targetScroll = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      });
    }
  };

  // Filter courses based on search, category, and filter
  const filteredCourses = useMemo(() => {
    const filtered = formattedCourses.filter(course => {
      // Skip courses that aren't enrolled for "in-progress" and "completed" filters
      if ((filter === "in-progress" || filter === "completed") && !course.isEnrolled) {
        return false;
      }

      const matchesSearch = search.toLowerCase().trim() === "" ||
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory = category === "all" ||
        course.category.toLowerCase() === category.toLowerCase();

      const matchesFilter = filter === "all" ||
        (filter === "in-progress" && course.progress > 0 && course.progress < 100) ||
        (filter === "completed" && course.progress === 100) ||
        (filter === "not-started" && course.progress === 0);

      return matchesSearch && matchesCategory && matchesFilter;
    });

    // Sort filtered courses
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "lastAccessed":
          return new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime();
        case "progress":
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

    const inProgressCourses = sorted.filter(c => c.isEnrolled && c.progress > 0 && c.progress < 100);
    const otherCourses = sorted.filter(c => !c.isEnrolled || c.progress === 0 || c.progress === 100);

    return { inProgressCourses, otherCourses };
  }, [formattedCourses, search, category, filter, sortBy]);

  // Get the filtered courses
  const { inProgressCourses, otherCourses } = filteredCourses;

  // Instead of using fixed categories, derive them from available courses or database
  const availableCategories = useMemo(() => {
    // Map database categories to the expected format (id, label), or use fallback
    // Handle possible undefined state during initial loading
    const categoriesFromDb = dbCategories
      ? dbCategories.map(dbCat => ({
        id: dbCat.slug as string, // Use slug as id since it's a string identifier
        label: dbCat.name as string // Use name as label
      }))
      : fallbackCategories;

    // If no courses or only one course, don't show categories
    if (formattedCourses.length <= 1) {
      return [];
    }

    // Get unique categories from available courses
    const uniqueCategories = new Set<string>();
    formattedCourses.forEach(course => {
      if (course.category) {
        uniqueCategories.add(course.category.toLowerCase());
      }
    });

    // If there's only one unique category (or none), don't show category pills
    if (uniqueCategories.size <= 1) {
      return [];
    }

    // Always include "all" category first, then add course-specific categories
    const categories: { id: CourseCategory; label: string }[] = [{ id: "all", label: "All" }];

    // Match course categories with predefined ones when possible
    categoriesFromDb.forEach(predefinedCategory => {
      if (predefinedCategory.id !== "all" && uniqueCategories.has(predefinedCategory.id.toLowerCase())) {
        categories.push(predefinedCategory);
        uniqueCategories.delete(predefinedCategory.id.toLowerCase());
      }
    });

    // Add any remaining unique categories that weren't in predefined list
    Array.from(uniqueCategories).sort().forEach(categoryId => {
      // Capitalize first letter for label
      const label = categoryId.charAt(0).toUpperCase() + categoryId.slice(1);
      categories.push({ id: categoryId as CourseCategory, label });
    });

    return categories;
  }, [formattedCourses, dbCategories]);

  // Handle course click - navigate to course page instead of opening dialog
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

          {/* Category Pills - Only show when there are courses and not in selection mode */}
          {!selectionMode && availableCategories.length > 0 && (
            <div className="relative">
              <div className="overflow-hidden">
                <div className="relative py-2 sm:py-3">
                  <div
                    ref={scrollContainerRef}
                    className="flex gap-3 overflow-x-hidden scroll-smooth"
                  >
                    {availableCategories.map((cat) => (
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
                        )}>
                        {cat.label}
                      </Button>
                    ))}
                  </div>

                  {/* Navigation Arrows - only show if we have navigation needed */}
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
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading your courses...</p>
            </div>
          ) : (
            <>
              {/* Recently Added Section - only show if there are recent courses */}
              {formattedRecentCourses.length > 0 && (
                <section>
                  <h2 className="font-medium text-lg mb-4">Recently Added</h2>
                  <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
                    {formattedRecentCourses.map((course) => (
                      <CourseCard
                        key={`recent-${course.id}`}
                        course={course}
                        onClick={() => handleCourseClick(course.id)}
                        className="animate-in fade-in-50 duration-500"
                        selected={selectedCourses.has(course.id)}
                        onSelect={handleCourseSelection}
                        selectionMode={selectionMode}
                        onLongPress={handleLongPress}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Continue Learning Section - only show if there are in-progress courses */}
              {inProgressCourses.length > 0 && (
                <section>
                  <h2 className="font-medium text-lg mb-4">Continue Learning</h2>
                  <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
                    {inProgressCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onClick={() => handleCourseClick(course.id)}
                        className="animate-in fade-in-50 duration-500"
                        selected={selectedCourses.has(course.id)}
                        onSelect={handleCourseSelection}
                        selectionMode={selectionMode}
                        onLongPress={handleLongPress}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Other Courses Section - only show if there are other courses */}
              {otherCourses.length > 0 && (
                <section>
                  <h2 className="font-medium text-lg mb-4">
                    {filter === "completed" ? "Completed" :
                      filter === "not-started" ? "Start Learning" :
                        "All Courses"}
                  </h2>
                  <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
                    {otherCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onClick={() => handleCourseClick(course.id)}
                        className="animate-in fade-in-50 duration-500"
                        selected={selectedCourses.has(course.id)}
                        onSelect={handleCourseSelection}
                        selectionMode={selectionMode}
                        onLongPress={handleLongPress}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Enhanced empty state - show prominently when no courses */}
              {!isLoadingCourses && inProgressCourses.length === 0 && otherCourses.length === 0 && formattedRecentCourses.length === 0 && (
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
