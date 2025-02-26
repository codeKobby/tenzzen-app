"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Grid2X2,
  Menu,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  SlidersHorizontal as FiltersIcon
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"
import { Project, ProjectFilter, ProjectViewMode, ProjectSortOption } from "./types"
import { sampleProjects } from "./data"
import { ProjectCard } from "./components/project-card"
import { ProjectDialog } from "./components/project-dialog"
import { CourseGroupedView } from "./components/course-grouped-view"
import { GenerateProjectDialog } from "./components/generate-project-dialog"
import { TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"

// Project status filters for dropdown
const statusFilters: { id: ProjectFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "submitted", label: "Submitted" },
  { id: "graded", label: "Graded" }
]

// Project categories for the pills (new)
const categoryFilters = [
  { id: "all", label: "All" },
  { id: "programming", label: "Programming" },
  { id: "design", label: "Design" },
  { id: "architecture", label: "Architecture" },
  { id: "seo", label: "SEO" },
  { id: "business", label: "Business" },
  { id: "analytics", label: "Analytics" },
  { id: "marketing", label: "Marketing" },
  { id: "mobile", label: "Mobile Dev" },
]

// Difficulty filters for dropdown
const difficultyFilters = [
  { id: "all", label: "All Levels" },
  { id: "Beginner", label: "Beginner" },
  { id: "Intermediate", label: "Intermediate" },
  { id: "Advanced", label: "Advanced" }
]

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ProjectFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [viewMode, setViewMode] = useState<ProjectViewMode>("grid")
  const [sortBy, setSortBy] = useState<ProjectSortOption>("deadline")
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)

  // For category pills scrolling
  const tabsRef = useRef<HTMLDivElement>(null)
  const [showScrollButtons, setShowScrollButtons] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const { user } = useAuth()

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

  // Filter and sort projects
  const filteredAndSortedProjects = sampleProjects
    .filter(project => {
      // Search filter
      const matchesSearch = search.toLowerCase().trim() === "" ||
        project.title.toLowerCase().includes(search.toLowerCase()) ||
        project.description.toLowerCase().includes(search.toLowerCase()) ||
        project.courses.some(course => course.title.toLowerCase().includes(search.toLowerCase()))

      // Status filter
      const matchesStatusFilter = statusFilter === "all" ||
        (statusFilter === "pending" && (project.status === "Not Started" || project.status === "In Progress")) ||
        (statusFilter === "submitted" && project.status === "Submitted") ||
        (statusFilter === "graded" && project.status === "Graded")

      // Category filter (simulate category matching based on project titles/descriptions)
      const matchesCategoryFilter = categoryFilter === "all" ||
        (categoryFilter === "programming" && (
          project.title.toLowerCase().includes("web") ||
          project.title.toLowerCase().includes("api") ||
          project.description.toLowerCase().includes("javascript") ||
          project.description.toLowerCase().includes("python")
        )) ||
        (categoryFilter === "design" && (
          project.title.toLowerCase().includes("design") ||
          project.title.toLowerCase().includes("ui") ||
          project.description.toLowerCase().includes("mockup") ||
          project.description.toLowerCase().includes("figma")
        )) ||
        (categoryFilter === "architecture" && (
          project.title.toLowerCase().includes("architecture") ||
          project.description.toLowerCase().includes("infrastructure") ||
          project.description.toLowerCase().includes("system design")
        )) ||
        (categoryFilter === "seo" && (
          project.title.toLowerCase().includes("seo") ||
          project.description.toLowerCase().includes("search engine") ||
          project.description.toLowerCase().includes("optimization")
        )) ||
        (categoryFilter === "business" && (
          project.title.toLowerCase().includes("business") ||
          project.description.toLowerCase().includes("startup") ||
          project.description.toLowerCase().includes("entrepreneur")
        )) ||
        (categoryFilter === "analytics" && (
          project.title.toLowerCase().includes("analytics") ||
          project.title.toLowerCase().includes("data") ||
          project.description.toLowerCase().includes("visualization") ||
          project.description.toLowerCase().includes("dashboard")
        )) ||
        (categoryFilter === "marketing" && (
          project.title.toLowerCase().includes("marketing") ||
          project.description.toLowerCase().includes("campaign") ||
          project.description.toLowerCase().includes("content")
        )) ||
        (categoryFilter === "mobile" && (
          project.title.toLowerCase().includes("mobile") ||
          project.title.toLowerCase().includes("app") ||
          project.description.toLowerCase().includes("android") ||
          project.description.toLowerCase().includes("ios")
        ))

      // Difficulty filter
      const matchesDifficulty = difficultyFilter === "all" || project.difficulty === difficultyFilter

      return matchesSearch && matchesStatusFilter && matchesDifficulty && matchesCategoryFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          // Sort by deadline (projects with no deadline come last)
          if (a.dueDate && b.dueDate) {
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          } else if (a.dueDate) {
            return -1
          } else if (b.dueDate) {
            return 1
          }
          return 0

        case "title":
          // Sort alphabetically by title
          return a.title.localeCompare(b.title)

        case "recent":
          // Sort by creation date (newest first)
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

        default:
          return 0
      }
    })

  const hasProjects = filteredAndSortedProjects.length > 0

  return (
    <div className="h-full">
      {/* Fixed Header */}
      <div className="sticky top-16 z-10 bg-background">
        <div className={cn(
          "w-full mx-auto transition-all",
          "duration-300",
          TRANSITION_TIMING,
          "w-[95%] lg:w-[90%]"
        )}>
          {/* Search and Filter Row */}
          <div className="h-14 flex items-center gap-2 sm:gap-4">
            <div className="relative flex-1 max-w-[600px] min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full h-8 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggles */}
              <div className="hidden sm:flex rounded-md border p-0.5 h-9">
                <Toggle
                  pressed={viewMode === "grid"}
                  onPressedChange={() => setViewMode("grid")}
                  className="h-full data-[state=on]:bg-muted"
                  size="sm"
                  aria-label="Grid view"
                >
                  <Grid2X2 className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={viewMode === "course-grouped"}
                  onPressedChange={() => setViewMode("course-grouped")}
                  className="h-full data-[state=on]:bg-muted"
                  size="sm"
                  aria-label="Course grouped view"
                >
                  <Menu className="h-4 w-4" />
                </Toggle>
              </div>

              {/* Filter Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <FiltersIcon className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[240px]">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Status</DropdownMenuLabel>
                  {statusFilters.map((f) => (
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

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Difficulty</DropdownMenuLabel>
                  {difficultyFilters.map((f) => (
                    <DropdownMenuItem
                      key={f.id}
                      onClick={() => setDifficultyFilter(f.id)}
                      className={cn(
                        "cursor-pointer",
                        difficultyFilter === f.id && "bg-muted"
                      )}
                    >
                      {f.label}
                      {difficultyFilter === f.id && (
                        <span className="ml-auto">✓</span>
                      )}
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setSortBy("deadline")}
                    className={cn(
                      "cursor-pointer",
                      sortBy === "deadline" && "bg-muted"
                    )}
                  >
                    Deadline
                    {sortBy === "deadline" && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("title")}
                    className={cn(
                      "cursor-pointer",
                      sortBy === "title" && "bg-muted"
                    )}
                  >
                    Title
                    {sortBy === "title" && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy("recent")}
                    className={cn(
                      "cursor-pointer",
                      sortBy === "recent" && "bg-muted"
                    )}
                  >
                    Recently Added
                    {sortBy === "recent" && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>View Mode</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "cursor-pointer",
                      viewMode === "grid" && "bg-muted"
                    )}
                  >
                    Grid View
                    {viewMode === "grid" && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setViewMode("course-grouped")}
                    className={cn(
                      "cursor-pointer",
                      viewMode === "course-grouped" && "bg-muted"
                    )}
                  >
                    Course Grouped
                    {viewMode === "course-grouped" && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Category Pills */}
          <div className="relative py-2 sm:py-3">
            <div
              ref={tabsRef}
              className="overflow-hidden" // Removed overflow-x-auto and hide-scrollbar to prevent scrolling
              onScroll={handleTabsScroll}
            >
              <Tabs
                defaultValue="all"
                className="w-full"
                onValueChange={(value) => setCategoryFilter(value)}
              >
                <TabsList className="p-0 bg-transparent h-auto gap-3">
                  {categoryFilters.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className={cn(
                        "h-8 rounded-lg font-normal transition-all whitespace-nowrap text-sm",
                        "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md",
                        "data-[state=inactive]:bg-transparent data-[state=inactive]:text-foreground",
                        "hover:bg-secondary"
                      )}
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Navigation Arrows - always show them if content overflows */}
            {showScrollButtons && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md",
                    !canScrollLeft && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => scrollTabs('left')}
                  disabled={!canScrollLeft}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background shadow-md",
                    !canScrollRight && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => scrollTabs('right')}
                  disabled={!canScrollRight}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "mx-auto space-y-6 pt-4 pb-12",
        "transition-all",
        "duration-300",
        TRANSITION_TIMING,
        "w-[95%] lg:w-[90%]"
      )}>
        {/* Header with title and create button */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Apply your learning with hands-on projects
            </p>
          </div>

          <Button onClick={() => setShowGenerateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Generate Project
          </Button>
        </div>

        {/* Project Content */}
        {hasProjects ? (
          <div className="space-y-8">
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
                {filteredAndSortedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => setSelectedProject(project)}
                    className="animate-in fade-in-50 duration-500"
                  />
                ))}
              </div>
            )}

            {/* Course Grouped View */}
            {viewMode === "course-grouped" && (
              <CourseGroupedView
                projects={filteredAndSortedProjects}
                onProjectClick={(project) => setSelectedProject(project)}
              />
            )}

            {/* Project Dialog for viewing details */}
            <ProjectDialog
              project={selectedProject}
              open={!!selectedProject}
              onOpenChange={(open) => !open && setSelectedProject(null)}
            />
          </div>
        ) : (
          // No projects match filters
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-1">No projects found</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {search
                ? `No projects match "${search}"`
                : categoryFilter !== "all"
                  ? "No projects match the selected category"
                  : "Create your first project or request a new project from your courses"}
            </p>
            <Button onClick={() => setShowGenerateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Generate Project
            </Button>
          </div>
        )}
      </div>

      {/* Generate Project Dialog */}
      <GenerateProjectDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
      />
    </div>
  )
}
