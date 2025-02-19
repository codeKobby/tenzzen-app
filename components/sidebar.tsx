"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { useAuth } from "@/hooks/use-auth"
import { type User } from "@/types/auth"
import {
  BookOpen,
  ChevronLeft,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Settings,
  Bug,
  Compass,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
}

const publicNavigation: NavigationItem[] = [
  {
    title: "Explore",
    href: "/explore",
    icon: Compass,
  },
  {
    title: "Billing",
    href: "/billing",
    icon: Wallet,
  },
]

const protectedNavigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Courses",
    href: "/courses",
    icon: BookOpen,
    badge: "New",
  },
  {
    title: "Library",
    href: "/library",
    icon: Library,
  },
]

const settingsNavigation: NavigationItem[] = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    title: "Report Bug",
    href: "/report-bug",
    icon: Bug,
  },
]

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

export function Sidebar({ children, className }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()
  const { supabase, user } = useAuth()
  const { resolvedTheme } = useTheme()
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleNavigation = () => {
    if (isMobile) {
      toggle()
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      if (navigator.vibrate) navigator.vibrate([20])
      toast({
        title: "Signed out successfully",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error signing out",
        variant: "destructive",
      })
    }
  }

  const NavigationLink = ({ item }: { item: NavigationItem }) => {
    const isActive = pathname === item.href
    const Icon = item.icon

    return (
      <Link
        href={item.href}
        onClick={() => handleNavigation()}
        className={cn(
          "group relative flex items-center gap-2 rounded-md px-2",
          "h-8",
          "transition-all duration-200 ease-out hover:bg-accent active:scale-[0.98]",
          "touch-action-manipulation focus-visible:outline-none focus-visible:ring-2",
          isActive && [
            "bg-primary",
            "before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-background",
          ],
          "focus-visible:ring-ring"
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5",
            "transition-all duration-200",
            "group-hover:scale-110 group-active:scale-95",
            isActive ? "text-background" : "text-muted-foreground"
          )}
        />
        <span className={cn(
          "text-xs font-medium",
          isActive ? "text-background" : "text-foreground",
          !isOpen && "lg:hidden"
        )}>
          {item.title}
        </span>
        {item.badge && (
          <span className={cn(
            "ml-auto rounded-full px-1.5 py-px text-[10px] font-medium",
            isActive ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
            !isOpen && "lg:hidden"
          )}>
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  const NavigationGroup = ({ items, title }: { items: NavigationItem[]; title?: string }) => (
    <div className="space-y-1">
      {title && (
        <h3 className={cn(
          "mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60",
          !isOpen && "lg:hidden"
        )}>
          {title}
        </h3>
      )}
      {items.map((item) => (
        <NavigationLink key={item.href} item={item} />
      ))}
    </div>
  )

  const getAvatarImage = (user: User | null): string | undefined => {
    if (user && 'image' in user && typeof user.image === 'string') {
      return user.image;
    }
    return undefined;
  }

  const UserProfile = () => (
    <div className="flex flex-col justify-end border-t">
      <div className="px-3 py-2">
        <div className={cn(
          "flex items-center gap-2 rounded-md bg-accent/50 px-2 py-1.5",
          !isOpen && "lg:justify-center"
        )}>
          <Avatar className="h-7 w-7 shrink-0">
            {getAvatarImage(user) && (
              <AvatarImage src={getAvatarImage(user)} />
            )}
            <AvatarFallback className="text-xs">
              {user?.email?.[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className={cn("flex-1 truncate", !isOpen && "lg:hidden")}>
            <p className="truncate text-xs font-medium text-foreground">
              {user?.email}
            </p>
            <p className="text-[10px] text-muted-foreground">
              Free Plan
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "group mt-1 flex h-8 w-full items-center justify-start gap-2 rounded-md px-2",
            "text-xs font-medium",
            "transition-all duration-200 ease-out active:scale-[0.98]",
            "text-foreground hover:bg-destructive/10 hover:text-destructive",
            "focus-visible:ring-2 focus-visible:ring-ring",
            !isOpen && "lg:justify-center"
          )}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          <span className={cn("truncate", !isOpen && "lg:hidden")}>Sign out</span>
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 left-4 z-50 h-9 w-9",
          isMobile ? "flex" : "hidden lg:flex"
        )}
        onClick={toggle}
      >
        {isMobile ? (
          <Menu className="h-4 w-4" />
        ) : (
          <ChevronLeft className={cn(
            "h-4 w-4 transition-transform duration-200",
            !isOpen && "rotate-180"
          )} />
        )}
      </Button>

      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex flex-col border-r bg-card",
            "transition-all duration-500 ease-in-out",
            isMobile ? "fixed left-0 top-0 z-40 h-[100dvh]" : "relative h-screen",
            isOpen ? "w-[240px] opacity-100 visible" : "w-0 opacity-0 invisible",
            !isOpen && isMobile && "-translate-x-full",
            className
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-6 w-6 shrink-0 text-primary" />
                <span className="text-base font-bold tracking-tight text-foreground">
                  Tenzzen
                </span>
              </div>
              {/* Mobile Close Button */}
              {isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={toggle}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Navigation */}
            <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-3 py-2">
              <nav className="space-y-4">
                <NavigationGroup items={publicNavigation} title="Menu" />
                {user && (
                  <>
                    <NavigationGroup items={protectedNavigation} />
                    <Separator className="my-2" />
                    <NavigationGroup items={settingsNavigation} title="Settings" />
                  </>
                )}
              </nav>
            </div>

            {/* Profile */}
            {user && <UserProfile />}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className={cn(
            "mx-auto w-full px-6",
            "transition-all duration-500 ease-in-out"
          )}>
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
