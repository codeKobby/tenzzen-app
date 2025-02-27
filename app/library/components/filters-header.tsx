"use client"

import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  SlidersHorizontal,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import { CategoryFilter } from "../page"
import { ViewSwitcher, ViewMode } from "./view-switcher"

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  filter: CategoryFilter;
  onFilterChange: (value: CategoryFilter) => void;
  sort: "recent" | "title" | "course";
  onSortChange: (value: "recent" | "title" | "course") => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
  categoryCounts: Record<CategoryFilter, number>;
}

const categoryPills = [
  { id: "all", label: "All Notes" },
  { id: "starred", label: "Starred" },
  { id: "course", label: "Course Notes" },
  { id: "personal", label: "Personal Notes" },
  { id: "code", label: "Code Snippets" },
] as const;

const sortOptions = [
  { id: "recent", label: "Most Recent" },
  { id: "title", label: "Title A-Z" },
  { id: "course", label: "By Course" },
] as const;

export function FiltersHeader({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  sort,
  onSortChange,
  categoryCounts,
  view,
  onViewChange,
}: Props) {
  const [showSearch, setShowSearch] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showScrollButtons, setShowScrollButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll capability on mount and resize
  useEffect(() => {
    const checkScroll = () => {
      if (tabsRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current;
        setShowScrollButtons(scrollWidth > clientWidth);
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
      }
    };

    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  // Update scroll state when scrolling the tabs
  const handleTabsScroll = () => {
    if (tabsRef.current) {
      const { scrollWidth, clientWidth, scrollLeft } = tabsRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  // Handle scroll button clicks
  const scrollTabs = (direction: "left" | "right") => {
    if (tabsRef.current) {
      const scrollAmount = direction === "left" ? -200 : 200;
      tabsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handleSearchClose = () => {
    setShowSearch(false);
    onSearchChange("");
  };

  return (
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
              placeholder="Search notes, tags, courses..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
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
                    placeholder="Search notes, tags, courses..."
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
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
            <ViewSwitcher
              currentView={view}
              onViewChange={onViewChange}
            />
            
            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sortOptions.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => onSortChange(option.id)}
                    className={cn(
                      "cursor-pointer",
                      sort === option.id && "bg-muted"
                    )}
                  >
                    {option.label}
                    {sort === option.id && (
                      <span className="ml-auto">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
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
              {categoryPills.map((tag) => (
                <button
                  key={`category-${tag.id}`}
                  onClick={() => onFilterChange(tag.id)}
                  className={cn(
                    "h-8 px-4 rounded-lg font-normal transition-all whitespace-nowrap text-sm select-none",
                    filter === tag.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {tag.label} {categoryCounts[tag.id] > 0 && (
                    <span className="ml-1 text-xs opacity-70">
                      {categoryCounts[tag.id]}
                    </span>
                  )}
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
              onClick={() => scrollTabs("left")}
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
              onClick={() => scrollTabs("right")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
