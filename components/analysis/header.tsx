"use client"

import * as React from "react"
import Link from "next/link"
import { useAnalysis } from "@/hooks/use-analysis-context"
import { mockCourseData } from "@/lib/mock/course-data"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Bell, ArrowLeft, Menu, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

interface BreadcrumbItem {
  label: string
  href: string
}

function getBreadcrumbFromPath(path: string): BreadcrumbItem[] {
  if (path === "/") return []
  const segments = path.split("/").filter(Boolean)

  return segments.map((segment, index) => ({
    label: segment === "analysis" ? "Course Generation" : segment.charAt(0).toUpperCase() + segment.slice(1),
    href: "/" + segments.slice(0, index + 1).join("/"),
  }))
}

export function AnalysisHeader() {
  const { showAlert, setShowAlert, courseData, courseGenerating, toggle } = useAnalysis()
  const { user } = useUser()
  const router = useRouter()
  const [scrolled, setScrolled] = React.useState(false)
  const [showScrollTop, setShowScrollTop] = React.useState(false)
  const breadcrumbs = getBreadcrumbFromPath("/analysis")

  // Get course title from context or mock data
  const courseMockData = mockCourseData
  const courseTitle = courseData || courseGenerating ? courseMockData.title : ""

  // Handle back button navigation
  const handleBack = () => {
    if (courseData) {
      setShowAlert(true)
      return
    }
    window.history.back()
  }

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0)
      setShowScrollTop(window.scrollY > 300) // Show scroll button after scrolling down 300px
    }
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <header className={cn(
      "sticky top-0 z-40 w-full border-b bg-background shadow-sm",
      scrolled && "shadow-sm"
    )}>
      <div className={cn(
        "mx-auto w-[95%] lg:w-[90%] flex h-16 items-center justify-between",
        `transition-all duration-300 ease-in-out`
      )}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-transparent"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 transition-colors hover:text-primary" />
            </Button>
            <div className="h-4 w-px bg-border" />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-transparent sm:hidden"
            onClick={() => toggle?.(true)}
          >
            <Menu className="h-4 w-4 transition-colors hover:text-primary" />
          </Button>

          {/* Hide "Course Generation" on small screens when a course title is displayed */}
          <nav className="flex items-center gap-2 text-sm sm:ml-6">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.href}>
                {index > 0 && (
                  <span className="text-muted-foreground/40">/</span>
                )}
                <span
                  className={cn(
                    "transition-colors hover:text-foreground",
                    index === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                    // Hide "Course Generation" on small screens when course title is shown
                    (courseTitle && item.label === "Course Generation") ? "hidden sm:inline" : ""
                  )}
                >
                  {item.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Centered title - only show when course exists */}
        {courseTitle && (
          <div className="flex-1 text-center font-semibold text-lg truncate max-w-xs sm:max-w-md md:max-w-lg">
            {courseTitle}
          </div>
        )}

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 hover:bg-transparent"
              >
                <Bell className="h-4 w-4 transition-colors hover:text-primary" />
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  2
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[300px]">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-[400px] overflow-auto">
                {[1, 2].map((i) => (
                  <DropdownMenuItem key={i} className="cursor-pointer p-4">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium">New course available</p>
                      <p className="text-xs text-muted-foreground">
                        Check out our latest course on React development
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        2 hours ago
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-full hover:bg-transparent transition-colors"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={user?.imageUrl}
                    alt={user?.fullName || "User avatar"}
                  />
                  <AvatarFallback>
                    {user?.fullName?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium text-sm">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user?.primaryEmailAddress?.emailAddress || "No email"}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Scroll to top button - positioned on the bottom right */}
      {showScrollTop && (
        <Button
          variant="secondary"
          size="icon"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 h-10 w-10 rounded-full shadow-lg z-50 animate-in fade-in"
        >
          <ArrowUp className="h-5 w-5" />
        </Button>
      )}
    </header>
  )
}
