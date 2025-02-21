"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Bell, ChevronLeft, PanelLeftOpen, PanelLeftClose } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import { useSidebar } from "@/hooks/use-sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface BreadcrumbItem {
  label: string
  href: string
}

function getBreadcrumbFromPath(path: string): BreadcrumbItem[] {
  if (path === "/") return []
  const segments = path.split("/").filter(Boolean)
  return segments.map((segment, index) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    href: "/" + segments.slice(0, index + 1).join("/"),
  }))
}

export function PageHeader() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { isOpen, toggle } = useSidebar()
  const [isMobile, setIsMobile] = React.useState(false)
  const [scrolled, setScrolled] = React.useState(false)
  const breadcrumbs = getBreadcrumbFromPath(pathname)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    const handleScroll = () => setScrolled(window.scrollY > 0)

    checkMobile()
    handleScroll()
    
    window.addEventListener("resize", checkMobile)
    window.addEventListener("scroll", handleScroll)
    
    return () => {
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <header className={cn(
      "w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40",
      scrolled && "shadow-sm"
    )}>
      <div className={cn(
        "flex h-16 items-center justify-between transition-[padding] duration-300 ease-in-out",
        isOpen ? "lg:pl-[280px]" : "pl-8",
        "pr-8"
      )}>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-transparent"
              onClick={toggle}
            >
              {isOpen ? (
                <PanelLeftClose className="h-4 w-4 transition-colors hover:text-primary" />
              ) : (
                <PanelLeftOpen className="h-4 w-4 transition-colors hover:text-primary" />
              )}
            </Button>
            <div className="h-4 w-px bg-border" />
          </div>

          <nav className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={item.href}>
                {index > 0 && (
                  <span className="text-muted-foreground/40">/</span>
                )}
                <Link
                  href={item.href}
                  className={cn(
                    "transition-colors hover:text-foreground",
                    index === breadcrumbs.length - 1
                      ? "text-foreground font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              </React.Fragment>
            ))}
          </nav>
        </div>

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
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.user_metadata?.full_name || "User avatar"}
                  />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.user_metadata?.full_name && (
                    <p className="font-medium text-sm">{user.user_metadata.full_name}</p>
                  )}
                  {user?.email && (
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  )}
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
    </header>
  )
}
