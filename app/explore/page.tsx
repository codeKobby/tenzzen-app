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
    DropdownMenuSeparator,
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
import { useCategoryCourses } from "./hooks/use-category-courses"
import { useUserCourses } from "../courses/hooks/use-user-courses"
import { CourseCardSkeleton } from "@/components/ui/course-card-skeleton"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

const sortOptions = [
    { id: "relevance", label: "Featured" },
    { id: "trending", label: "Trending" },
    { id: "top_rated", label: "Top Rated" },
    { id: "new", label: "Newest" },
]

const filterOptions = [
    { id: "all", label: "All Courses" },
]

export default function ExplorePage() {
    const router = useRouter()
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState("relevance")
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

    // Get user courses for recommendation algorithm
    const {
        courses: userCourses,
        categories: userCategories,
        loading: userCoursesLoading,
        error: userCoursesError
    } = useUserCourses();

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
        interestedCategories: userCategories,
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


    // Log any errors with user courses for debugging
    useEffect(() => {
        if (userCoursesError) {
            console.warn("Error loading user courses:", userCoursesError);
        }
    }, [userCoursesError]);

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
                    {/* Controls Bar */}
                    <div className="h-14 flex items-center justify-between gap-4">
                        {/* Left Side: Filters/Controls */}
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" className="h-10 rounded-full px-4 gap-2 flex-shrink-0">
                                        <SlidersHorizontal className="h-4 w-4" />
                                        <span className="hidden xs:inline">Filters</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[240px]">
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
                                    <DropdownMenuSeparator />
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
                        </div>

                        {/* Center: Search Bar */}
                        <div className="flex-1 flex justify-center max-w-[620px] mx-auto min-w-0">
                            <div className="flex w-full items-center">
                                <div className="relative flex-1 flex items-center">
                                    <div className="absolute left-4 text-muted-foreground pointer-events-none">
                                        <Search className="h-4 w-4" />
                                    </div>
                                    <Input
                                        placeholder="Search courses..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-10 pl-11 pr-4 rounded-l-full bg-background border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                                    />
                                </div>
                                <Button
                                    variant="secondary"
                                    className="h-10 px-5 rounded-r-full border-l-0 border border-border bg-muted hover:bg-secondary/80 flex-shrink-0"
                                    onClick={() => { }}
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Right Side: Primary Action */}
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => user ? setShowGenerateModal(true) : setShowAuthPrompt(true)}
                                className="h-10 rounded-full px-4 gap-2 font-medium"
                            >
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Generate Course</span>
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
                            showRecommended={false}
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
                {/* Recommended / Filtered / Categorized Feed */}
                <section className="space-y-4">
                    {(searchQuery || currentCategory !== 'all' || sortBy !== 'relevance') && (
                        <h2 className="text-xl font-semibold">
                            {searchQuery
                                ? `Search Results for "${searchQuery}"`
                                : currentCategory !== 'all'
                                    ? `${availableCategories.find(cat => cat.slug === currentCategory)?.name || currentCategory.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Courses`
                                    : sortOptions.find(o => o.id === sortBy)?.label
                            }
                        </h2>
                    )}

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
                    ) : (searchQuery || currentCategory !== 'all') ? (
                        <div className="text-center py-12 border border-dashed rounded-lg border-muted-foreground/20 bg-muted/5">
                            <p className="text-muted-foreground">No courses found matching your search.</p>
                            <Button variant="link" className="mt-2" onClick={() => {
                                setSearchQuery("");
                                const url = new URL(window.location.href);
                                url.searchParams.delete('category');
                                window.history.pushState({}, '', url.toString());
                                window.location.reload();
                            }}>Clear filters</Button>
                        </div>
                    ) : null}
                    <div ref={loadMoreRef} className="py-4" />
                </section>

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
