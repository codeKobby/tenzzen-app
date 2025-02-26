"use client"

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import {
    Search,
    Compass,
    BookOpen,
    Trophy,
    Target,
    Plus,
    TrendingUp,
    Sparkles,
    SlidersHorizontal,
    Filter,
    ChevronLeft,
    ChevronRight,
    X,
    Loader2
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CourseGenerationModal } from "./components/course-generation-modal"
import { CourseCard } from "../courses/components/course-card"
import { sampleCourses } from "../courses/data"
import { Course } from "../courses/types"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import Link from "next/link"

const categoryPills = [
    { id: "all", label: "All Categories" },
    { id: "programming", label: "Programming" },
    { id: "design", label: "Design" },
    { id: "business", label: "Business" },
    { id: "marketing", label: "Marketing" },
    { id: "analytics", label: "Analytics" },
    { id: "mobile", label: "Mobile Dev" },
    { id: "ai", label: "AI & ML" },
    { id: "webdev", label: "Web Development" }
]

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

const ITEMS_PER_PAGE = 12

export default function ExplorePage() {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [sortBy, setSortBy] = useState("enrollments")
    const [statusFilter, setStatusFilter] = useState("all")
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const [showSearch, setShowSearch] = useState(false)
    const [displayedCourses, setDisplayedCourses] = useState<Array<Course>>([])
    const [page, setPage] = useState<number>(1)
    const [isLoading, setIsLoading] = useState(false)
    const [hasMore, setHasMore] = useState(true)
    const loadMoreRef = useRef<HTMLDivElement>(null)

    // For category pills scrolling
    const tabsRef = useRef<HTMLDivElement>(null)
    const [showScrollButtons, setShowScrollButtons] = useState(false)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    // Check scroll capability on mount and resize
    useEffect(() => {
        const checkScroll = () => {
            if (tabsRef.current) {
                const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current
                setShowScrollButtons(scrollWidth > clientWidth)
                setCanScrollLeft(scrollLeft > 0)
                setCanScrollRight(scrollLeft + clientWidth < scrollWidth)
            }
        }

        checkScroll()
        window.addEventListener("resize", checkScroll)
        return () => window.removeEventListener("resize", checkScroll)
    }, [])

    // Update scroll state when scrolling the tabs
    const handleTabsScroll = () => {
        if (tabsRef.current) {
            const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft + clientWidth < scrollWidth)
        }
    }

    // Handle scroll button clicks
    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsRef.current) {
            const scrollAmount = direction === 'left' ? -200 : 200
            tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    // Filter and sort courses
    const filteredCourses = useMemo(() => {
        return sampleCourses
            .filter(course => course.isPublic)
            .filter(course => {
                const matchesSearch = searchQuery.toLowerCase().trim() === "" ||
                    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    course.description.toLowerCase().includes(searchQuery.toLowerCase())

                const matchesCategory = selectedCategory === "all" ||
                    course.category.toLowerCase() === selectedCategory.toLowerCase()

                const matchesStatus = statusFilter === "all" ||
                    (statusFilter === "popular" && (course.enrolledCount || 0) > 1000) ||
                    (statusFilter === "highly-rated" && (course.rating || 0) > 4.5) ||
                    (statusFilter === "new" && !course.lastAccessed)

                return matchesSearch && matchesCategory && matchesStatus
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case "enrollments":
                        return (b.enrolledCount || 0) - (a.enrolledCount || 0)
                    case "rating":
                        return (b.rating || 0) - (a.rating || 0)
                    case "recent":
                        // For new courses without lastAccessed, put them first
                        if (!a.lastAccessed && !b.lastAccessed) return 0
                        if (!a.lastAccessed) return -1
                        if (!b.lastAccessed) return 1
                        return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
                    default:
                        return 0
                }
            })
    }, [searchQuery, selectedCategory, sortBy, statusFilter])

    // Load more courses when scrolling
    const loadMoreCourses = useCallback(() => {
        if (isLoading || !hasMore) return

        setIsLoading(true)
        // Simulate loading delay
        setTimeout(() => {
            const start = (page - 1) * ITEMS_PER_PAGE
            const end = start + ITEMS_PER_PAGE
            const newCourses = filteredCourses.slice(start, end)
            
            if (newCourses.length > 0) {
                setDisplayedCourses(prev => [...prev, ...newCourses])
                setPage(prev => prev + 1)
                setHasMore(end < filteredCourses.length)
            } else {
                setHasMore(false)
            }
            setIsLoading(false)
        }, 500)
    }, [filteredCourses, page, isLoading, hasMore])

    // Setup intersection observer for infinite scrolling
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    loadMoreCourses()
                }
            },
            { threshold: 0.1 }
        )

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current)
        }

        return () => observer.disconnect()
    }, [loadMoreCourses])

    // Reset pagination when filters change
    useEffect(() => {
        setDisplayedCourses([])
        setPage(1)
        setHasMore(true)
    }, [searchQuery, selectedCategory, sortBy, statusFilter])

    // Initial load
    useEffect(() => {
        if (displayedCourses.length === 0 && filteredCourses.length > 0) {
            loadMoreCourses()
        }
    }, [displayedCourses.length, filteredCourses.length, loadMoreCourses])

    // Get recommended courses (for authenticated users)
    const recommendedCourses = useMemo(() => {
        if (!user) return []
        // In a real app, this would be based on user preferences and history
        return sampleCourses
            .filter(course => course.isPublic)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4)
    }, [user])

    // Get trending courses
    const trendingCourses = useMemo(() => {
        return sampleCourses
            .filter(course => course.isPublic)
            .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
            .slice(0, 4)
    }, [])

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
                    <div className="relative py-2 sm:py-3">
                        <div
                            ref={tabsRef}
                            className="overflow-hidden relative isolate"
                            onScroll={handleTabsScroll}
                        >
                            {/* Scroll Indicators */}
                            <div className={cn(
                                "absolute left-0 top-0 bottom-0 w-[80px] pointer-events-none z-10",
                                "bg-gradient-to-r from-background to-transparent",
                                "opacity-0 transition-opacity duration-300",
                                canScrollLeft && "opacity-100"
                            )} />
                            <div className={cn(
                                "absolute right-0 top-0 bottom-0 w-[80px] pointer-events-none z-10",
                                "bg-gradient-to-l from-background to-transparent",
                                "opacity-0 transition-opacity duration-300",
                                canScrollRight && "opacity-100"
                            )} />
                            <div className="flex gap-3">
                            {categoryPills.map((tag, index) => (
                                <button
                                    key={`category-${tag.id}`}
                                        onClick={() => setSelectedCategory(tag.id)}
                                        className={cn(
                                            "h-8 px-4 rounded-lg font-normal transition-all whitespace-nowrap text-sm select-none",
                                            selectedCategory === tag.id 
                                                ? "bg-primary text-primary-foreground shadow-sm" 
                                                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                        )}
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        <div className={cn(
                            "transition-opacity duration-200",
                            !showScrollButtons && "opacity-0 pointer-events-none"
                        )}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md z-20",
                                    "transition-opacity duration-200",
                                    !canScrollLeft && "opacity-0 pointer-events-none",
                                    canScrollLeft && "opacity-100"
                                )}
                                onClick={() => scrollTabs('left')}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md z-20",
                                    "transition-opacity duration-200",
                                    !canScrollRight && "opacity-0 pointer-events-none",
                                    canScrollRight && "opacity-100"
                                )}
                                onClick={() => scrollTabs('right')}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className={cn(
                "mx-auto space-y-8 pt-4 pb-12",
                "w-[95%] lg:w-[90%]"
            )}>
                {/* Recommended Courses (for authenticated users) */}
                {user && recommendedCourses.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <h2 className="text-xl font-semibold">Recommended for You</h2>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {recommendedCourses.map((course) => (
                                <CourseCard
                                    key={course.id}
                                    course={course}
                                    variant="explore"
                                    onClick={() => {}} // Handle course selection
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Courses */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-semibold">Trending Courses</h2>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {trendingCourses.map((course) => (
                            <CourseCard
                                key={course.id}
                                course={course}
                                variant="explore"
                                onClick={() => {}} // Handle course selection
                            />
                        ))}
                    </div>
                </section>

                {/* All Courses */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">All Courses</h2>
                    {displayedCourses.length > 0 ? (
                        <>
                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {displayedCourses.map((course) => (
                                    <CourseCard
                                        key={course.id}
                                        course={course}
                                        variant="explore"
                                        onClick={() => {}} // Handle course selection
                                    />
                                ))}
                            </div>
                            <div ref={loadMoreRef} className="py-8 flex justify-center">
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                ) : hasMore ? (
                                    <div className="h-8" /> // Spacer for intersection observer
                                ) : (
                                    <p className="text-sm text-muted-foreground">No more courses to load</p>
                                )}
                            </div>
                        </>
                    ) : filteredCourses.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">No courses found matching your criteria</p>
                        </div>
                    ) : (
                        <div className="py-12 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    )}
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
        </div>
    )
}
