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
import { cn } from "@/lib/utils"
import { CourseCard } from "./components/course-card"
import { CourseDialog } from "./components/course-dialog"
import { Course, CourseFilter, CourseCategory } from "./types"
import { sampleCourses } from "./data"
import { CourseGenerationModal } from "@/components/modals/course-generation-modal"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { getLocalEnrollments, getUserEnrollments, getRecentEnrollments } from "@/lib/local-storage"

// Same filters and categories as before
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
  // State variables
  const [filter, setFilter] = useState<CourseFilter>("all")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<CourseCategory>("all")
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
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

  // Load courses with proper data fetching
  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);

      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check if we have localStorage fallback data
        if (typeof window !== 'undefined' && userId) {
          const userEnrollments = getUserEnrollments(userId);

          if (userEnrollments.length > 0) {
            console.log("Using localStorage fallback for enrollments");

            // Format recent courses from localStorage
            const recentEnrollments = getRecentEnrollments(userId, 2);
            const recentCourses = recentEnrollments.map((enrollment) => ({
              id: `local-${enrollment.courseTitle.replace(/\s+/g, '-').toLowerCase()}`,
              title: enrollment.courseTitle,
              description: enrollment.courseData.description,
              category: enrollment.courseData.metadata?.category || "Programming",
              image: enrollment.courseData.thumbnail || `/course-thumbnails/course-${Math.floor(Math.random() * 5) + 1}.jpg`,
              progress: enrollment.progress || 0,
              lessonsCompleted: enrollment.completedLessons?.length || 0,
              totalLessons: (enrollment.courseData.sections || []).reduce(
                (acc: number, section: any) => acc + (section.lessons?.length || 0),
                0
              ),
              lastAccessed: enrollment.lastAccessedAt,
              isNew: Date.now() - enrollment.enrolledAt < 7 * 24 * 60 * 60 * 1000,
              isEnrolled: true
            }));

            setFormattedRecentCourses(recentCourses);

            // Also add to all courses
            const allLocalCourses = userEnrollments.map((enrollment) => ({
              id: `local-${enrollment.courseTitle.replace(/\s+/g, '-').toLowerCase()}`,
              title: enrollment.courseTitle,
              description: enrollment.courseData.description,
              category: enrollment.courseData.metadata?.category || "Programming",
              image: enrollment.courseData.thumbnail || `/course-thumbnails/course-${Math.floor(Math.random() * 5) + 1}.jpg`,
              progress: enrollment.progress || 0,
              lessonsCompleted: enrollment.completedLessons?.length || 0,
              totalLessons: (enrollment.courseData.sections || []).reduce(
                (acc: number, section: any) => acc + (section.lessons?.length || 0),
                0
              ),
              lastAccessed: enrollment.lastAccessedAt,
              isNew: Date.now() - enrollment.enrolledAt < 7 * 24 * 60 * 60 * 1000,
              isEnrolled: true
            }));

            // Combine with sample courses for demo purposes
            const mergedCourses = [...allLocalCourses];

            if (mergedCourses.length < 4) {
              const sampleCoursesToAdd = sampleCourses
                .slice(0, Math.max(0, 6 - mergedCourses.length))
                .map(course => ({
                  ...course,
                  isEnrolled: false
                }));

              mergedCourses.push(...sampleCoursesToAdd);
            }

            setFormattedCourses(mergedCourses);
          } else {
            // No user enrollments, use sample data
            console.log("No user enrollments found, using sample data");

            // Process sample data for display
            const processedCourses = sampleCourses.map(course => ({
              ...course,
              isEnrolled: Math.random() > 0.5, // Randomly mark some courses as enrolled
              progress: Math.random() > 0.5 ? Math.floor(Math.random() * 100) : 0
            }));

            // Add two recent courses with progress = 0
            const recentSampleCourses = sampleCourses.slice(0, 2).map(course => ({
              ...course,
              progress: 0,
              isEnrolled: true,
              isNew: true,
              lastAccessed: Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 3 // Last 3 days
            }));

            setFormattedRecentCourses(recentSampleCourses);
            setFormattedCourses(processedCourses);
          }
        } else {
          // Fallback for SSR or no userId
          setFormattedCourses(sampleCourses);
          setFormattedRecentCourses([]);
        }
      } catch (error) {
        console.error("Failed to load courses:", error);
        toast.error("Failed to load courses");
        setFormattedCourses(sampleCourses);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [userId]);

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
                      )}>
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
          "w-full mx-auto px-4 space-y-8",
          "duration-300",
          "w-[95%] lg:w-[90%]"
        )}>
          {/* Loading state */}
          {isLoadingCourses ? (
            <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
              {[...Array(4)].map((_, i) => (
                <div key={`skeleton-${i}`} className="flex flex-col gap-3 rounded-lg border p-3 animate-pulse">
                  <div className="aspect-video w-full bg-muted rounded-md"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Recently Added Section */}
              {formattedRecentCourses.length > 0 && (
                <section>
                  <h2 className="font-medium text-lg mb-4">Recently Added</h2>
                  <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
                    {formattedRecentCourses.map((course) => (
                      <CourseCard
                        key={`recent-${course.id}`}
                        course={course}
                        onClick={() => setSelectedCourse(course)}
                        className="animate-in fade-in-50 duration-500"
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Continue Learning Section */}
              {inProgressCourses.length > 0 && (
                <section>
                  <h2 className="font-medium text-lg mb-4">Continue Learning</h2>
                  <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
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
                  <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 auto-rows-fr">
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

              {/* Empty state */}
              {!isLoadingCourses && inProgressCourses.length === 0 && otherCourses.length === 0 && formattedRecentCourses.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    {search
                      ? `No courses match "${search}"`
                      : "No courses found. Get started by generating your first course."}
                  </p>
                  <Button
                    onClick={() => setShowGenerateModal(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Generate Course
                  </Button>
                </div>
              )}
            </>
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
