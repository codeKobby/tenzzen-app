"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Search,
    Plus,
    TrendingUp,
    Sparkles,
    SlidersHorizontal,
    Filter,
    X,
    Loader2,
    RefreshCw,
    ArrowUp
} from "lucide-react"
import { CategoryPills } from "@/components/category-pills"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CourseGenerationModal } from "@/components/modals/course-generation-modal"
import { CourseCard } from "../courses/components/course-card"
import { Course } from "../courses/types"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"
import { useCourses } from "./hooks/use-courses"
import { useCategoryCourses } from "./hooks/use-category-courses"
import { useUserCourses } from "../courses/hooks/use-user-courses"
import { getRecommendedCourses } from "./utils/course-display-algorithms"
import { CourseCardSkeleton } from "@/components/ui/course-card-skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

const sortOptions = [
    { id: "enrollments", label: "Most Enrolled" },
    { id: "rating", label: "Highest Rated" },
    { id: "recent", label: "Recently Added" }
]

const filterOptions = [
    { id: "all", label: "All Courses" },
    { id: "popular", label: "Popular (>1000 enrolled)" },
    { id: "highly-rated", label: "Highly Rated (>4.5)" },
    { id: "new", label: "New Courses" }
]

export default function ExplorePage() {
    const router = useRouter()
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState("enrollments")
    const [statusFilter, setStatusFilter] = useState("all")
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [showBackToTop, setShowBackToTop] = useState(false)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    // Track scroll position for back-to-top button
    useEffect(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Use our new hook for category-based course loading with infinite scroll
    const {
        courses: displayedCourses,
        loading: isLoading,
        loadingMore,
        hasMore,
        totalCount,
        currentCategory,
        loadMore: loadMoreCourses,
        categories: availableCategories,
        error: coursesError
    } = useCategoryCourses({
        sortBy,
        filter: statusFilter,
        searchQuery,
        limit: 12
    });

    // Show error toast if there's an error loading courses
    useEffect(() => {
        if (coursesError) {
            // Use setTimeout to avoid React state updates during rendering
            setTimeout(() => {
                toast.error("Failed to load courses", {
                    description: "Please try refreshing the page",
                    action: {
                        label: "Retry",
                        onClick: () => window.location.reload()
                    }
                });
            }, 0);
        }
    }, [coursesError]);

    // Setup intersection observer for infinite scrolling
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && !loadingMore && hasMore) {
                    loadMoreCourses();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [loadMoreCourses, isLoading, loadingMore, hasMore]);

    // Get all courses for trending and recommendation algorithms
    const { courses: allCourses } = useCourses({
        limit: 100, // Get a larger set of courses for our algorithms
        sortBy: 'enrollments',
    });

    // Get user courses for recommendation algorithm
    const {
        courses: userCourses,
        categories: userCategories,
        loading: userCoursesLoading,
        error: userCoursesError
    } = useUserCourses();

    // Log any errors with user courses for debugging
    useEffect(() => {
        if (userCoursesError) {
            console.warn("Error loading user courses:", userCoursesError);
        }
    }, [userCoursesError]);

    // Validating Convex queries
    const trendingCoursesData = useQuery(api.courses.getTrendingCourses);
    const topRatedCoursesData = useQuery(api.courses.getTopRatedCourses);
    const newCoursesData = useQuery(api.courses.getNewCourses);

    // Calculate recommended courses using our algorithm
    const { showRecommendations, recommendedCourses } = useMemo(() => {
        if (!user) return { showRecommendations: false, recommendedCourses: [] };

        // Don't show recommendations if there's an error with user courses
        if (userCoursesError) return { showRecommendations: false, recommendedCourses: [] };

        // Don't show recommendations while user courses are loading
        if (userCoursesLoading) return { showRecommendations: false, recommendedCourses: [] };

        return getRecommendedCourses(
            allCourses,
            {
                enrolledCourses: userCourses || [],
                interestedCategories: userCategories || [],
                // Add more user history data as it becomes available
            }
        );
    }, [allCourses, user, userCourses, userCategories, userCoursesError, userCoursesLoading]);

    // Handle search close
    const handleSearchClose = () => {
        setShowSearch(false)
        setSearchQuery("")
    }

    return (
        <div className="h-full">
            {/* Fixed Header */}
            <div className="sticky top-16 z-10 bg-background">
                <div className={cn(
                    "w-full mx-auto transition-all",
                    "duration-300",
                    "w-[95%] lg:w-[90%]"
                )}>
                    {/* Search and Filter Row */}
                    <div className="h-14 flex items-center gap-2 sm:gap-4">
                        {/* Desktop Search */}
                        <div className="hidden sm:block relative flex-1 max-w-[600px] min-w-0">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search courses..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full h-8 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring"
                            />
                        </div>

                        {/* Mobile Search Button and Expanded Search */}
                        <div className="sm:hidden flex-1">
                            <AnimatePresence>
                                {showSearch ? (
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: "100%", opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        className="relative"
                                    >
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search courses..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-8 w-full h-8 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring"
                                        />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                                            onClick={handleSearchClose}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => setShowSearch(true)}
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Sort Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <SlidersHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px]">
                                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                                    {sortOptions.map((option) => (
                                        <DropdownMenuItem
                                            key={option.id}
                                            onClick={() => setSortBy(option.id)}
                                            className={cn(
                                                "cursor-pointer",
                                                sortBy === option.id && "bg-muted"
                                            )}
                                        >
                                            {option.label}
                                            {sortBy === option.id && (
                                                <span className="ml-auto">✓</span>
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Filter Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[240px]">
                                    <DropdownMenuLabel>Filter Courses</DropdownMenuLabel>
                                    {filterOptions.map((f) => (
                                        <DropdownMenuItem
                                            key={f.id}
                                            onClick={() => setStatusFilter(f.id)}
                                            className={cn(
                                                "cursor-pointer",
                                                statusFilter === f.id && "bg-muted"
                                            )}
                                        >
                                            {f.label}
                                            {statusFilter === f.id && (
                                                <span className="ml-auto">✓</span>
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                                onClick={() => user ? setShowGenerateModal(true) : setShowAuthPrompt(true)}
                                className="h-8"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Generate Course
                            </Button>
                        </div>
                    </div>

                    {/* Category Pills */}
                    <div className="py-2 sm:py-3">
                        <CategoryPills
                            customCategories={availableCategories?.map(cat => ({
                                name: cat.name,
                                slug: cat.slug,
                                courseCount: cat.courseCount
                            }))}
                            showRecommended={!!user}
                        />
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={cn(
                "mx-auto space-y-8 pt-4 pb-12",
                "w-[95%] lg:w-[90%]"
            )}>

                {/* Content Area: Tabs for Discovery or Filtered Results */}
                {(searchQuery || currentCategory !== 'all') ? (
                    // Filtered/Categorized View
                    <section className="space-y-4">
                        <h2 className="text-xl font-semibold">
                            {searchQuery
                                ? `Search Results for "${searchQuery}"`
                                : currentCategory === 'recommended'
                                    ? 'Recommended for You'
                                    : `${availableCategories.find(cat => cat.slug === currentCategory)?.name || currentCategory.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Courses`
                            }
                        </h2>

                        {coursesError && !isLoading && displayedCourses.length === 0 ? (
                            <div className="text-center py-12 border border-dashed rounded-lg border-destructive/20 bg-destructive/5">
                                <p className="text-muted-foreground mb-4">Failed to load courses. Please try again.</p>
                                <Button onClick={() => window.location.reload()} variant="outline">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Retry
                                </Button>
                            </div>
                        ) : isLoading && displayedCourses.length === 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {Array(8).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
                            </div>
                        ) : displayedCourses.length > 0 ? (
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {displayedCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        variant="explore"
                                        onClick={() => router.push(`/explore/${course.id}`)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 border border-dashed rounded-lg border-muted-foreground/20 bg-muted/5">
                                <p className="text-muted-foreground">No courses found.</p>
                                <Button variant="link" className="mt-2" onClick={() => {
                                    setSearchQuery("");
                                    const url = new URL(window.location.href);
                                    url.searchParams.delete('category');
                                    window.history.pushState({}, '', url.toString());
                                    // wrapper hook usually listens to URL or we force update
                                    window.location.reload();
                                }}>View all courses</Button>
                            </div>
                        )}
                        <div ref={loadMoreRef} className="py-4" />
                    </section>
                ) : (
                    // Default Discovery Tabs
                    <Tabs defaultValue="trending" className="space-y-6">
                        <div className="flex items-center justify-between">
                            <TabsList>
                                <TabsTrigger value="trending" className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" /> Trending
                                </TabsTrigger>
                                <TabsTrigger value="top_rated" className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" /> Top Rated
                                </TabsTrigger>
                                <TabsTrigger value="new" className="flex items-center gap-2">
                                    <Plus className="h-4 w-4" /> New
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="trending" className="space-y-4">
                            {!trendingCoursesData ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {Array(4).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {trendingCoursesData.map((course) => (
                                        <CourseCard
                                            key={course._id}
                                            course={{
                                                id: course._id,
                                                ...course,
                                                image: course.thumbnail,
                                                // Adapter for differences between Convex schema and frontend Course type
                                            } as any}
                                            variant="explore"
                                            onClick={() => router.push(`/explore/${course._id}`)}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="top_rated" className="space-y-4">
                            {!topRatedCoursesData ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {Array(4).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {topRatedCoursesData.map((course) => (
                                        <CourseCard
                                            key={course._id}
                                            course={{
                                                id: course._id,
                                                ...course,
                                                image: course.thumbnail,
                                            } as any}
                                            variant="explore"
                                            onClick={() => router.push(`/explore/${course._id}`)}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="new" className="space-y-4">
                            {!newCoursesData ? (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {Array(4).fill(0).map((_, i) => <CourseCardSkeleton key={i} />)}
                                </div>
                            ) : (
                                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {newCoursesData.map((course) => (
                                        <CourseCard
                                            key={course._id}
                                            course={{
                                                id: course._id,
                                                ...course,
                                                image: course.thumbnail,
                                            } as any}
                                            variant="explore"
                                            onClick={() => router.push(`/explore/${course._id}`)}
                                        />
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                )}

                {/* Course Generation Modal */}
                {showGenerateModal && (
                    <CourseGenerationModal
                        isOpen={showGenerateModal}
                        onClose={() => setShowGenerateModal(false)}
                    />
                )}

                {/* Auth Prompt Dialog */}
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
                                <Link href="/signin">Sign In</Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/signup">Create an Account</Link>
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Floating Back to Top Button */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            size="icon"
                            className="h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        >
                            <ArrowUp className="h-5 w-5" />
                            <span className="sr-only">Back to top</span>
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
