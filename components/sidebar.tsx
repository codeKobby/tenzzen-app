"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { useClerk } from "@clerk/nextjs"
import {
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Library,
  LogOut,
  X,
  Settings,
  Bug,
  Compass,
  Wallet,
  FolderKanban,
  Crown,
  Sun,
  Moon,
  Laptop,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  isPro?: boolean
}

const mainNavigation: NavigationItem[] = [
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
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    isPro: true,
  },
  {
    title: "Explore",
    href: "/explore",
    icon: Compass,
  },
]

const billingNavigation: NavigationItem[] = [
  {
    title: "Billing",
    href: "/billing",
    icon: Wallet,
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

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, toggle } = useSidebar()
  const { signOut } = useClerk()
  const { theme, setTheme } = useTheme()
  const [isMobile, setIsMobile] = React.useState(false)
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = React.useState(false)
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = React.useState(false)

  // Combined useEffect for all client-side operations
  React.useEffect(() => {
    setMounted(true)

    // Detect system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    updateSystemTheme(mediaQuery)
    mediaQuery.addEventListener('change', updateSystemTheme)

    // Check mobile
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024
      setIsMobile(isMobileView)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme)
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      // Use the redirectUrl option to specify where to redirect after sign-out
      await signOut()
      if (navigator.vibrate) navigator.vibrate([20])
      toast({
        title: "Signed out successfully",
        variant: "default",
      })
      // Manually redirect to sign-in page
      window.location.href = "/sign-in"
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Error signing out",
        variant: "destructive",
      })
    }
  }



  const NavigationLink = ({ item }: { item: NavigationItem }) => {
    // Check if current route matches or is a child route of this nav item
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
    const Icon = item.icon

    return (
      <Link
        href={item.href as "/dashboard"}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-lg px-2.5",
          "h-9",
          "transition-all duration-200 ease-out",
          !isActive && "hover:bg-primary/10",
          "touch-action-manipulation focus-visible:outline-none group",
          isActive && [
            "bg-primary text-primary-foreground",
            "before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-primary-foreground/80",
          ]
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4",
            "transition-colors duration-200",
            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"
          )}
        />
        <span className={cn(
          "text-sm font-medium",
          isActive ? "text-primary-foreground" : "text-foreground",
          !isOpen && "hidden"
        )}>
          {item.title}
        </span>
        {item.badge && (
          <span className={cn(
            "ml-auto rounded-full px-1.5 py-px text-[10px] font-medium",
            isActive ? "bg-background/20 text-background" : "bg-muted text-muted-foreground",
            !isOpen && "lg:block hidden"
          )}>
            {item.badge}
          </span>
        )}
        {item.isPro && (
          <Crown className={cn(
            "ml-auto h-3.5 w-3.5",
            isActive ? "text-background/80" : "text-yellow-500",
            !isOpen && "lg:block hidden"
          )} />
        )}
      </Link>
    )
  }

  const NavigationGroup = ({ items, title }: { items: NavigationItem[]; title?: string }) => (
    <div className="space-y-1">
      {title && (
        <h3 className={cn(
          "mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60",
          !isOpen && "hidden"
        )}>
          {title}
        </h3>
      )}
      {items.map((item) => (
        <NavigationLink key={item.href} item={item} />
      ))}
    </div>
  )

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={cn(
            "fixed inset-0 bg-background/50 backdrop-blur-sm z-40",
            "lg:hidden" // Only show overlay on mobile
          )}
          onClick={toggle}
        />
      )}

      <aside
        className={cn(
          "border-r bg-card h-screen w-[280px]",
          "z-50 fixed left-0 top-0",
          `transition-transform duration-[${TRANSITION_DURATION}ms] ${TRANSITION_TIMING}`,
          !isOpen && "-translate-x-full", // Removed lg:translate-x-0 to allow hiding on all screen sizes
          "overflow-hidden flex flex-col",
          className
        )}
      >
        <div className="flex h-full w-full flex-col">
          <div className="flex items-center justify-between px-4 py-2.5">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className={cn(
                "text-sm font-bold tracking-tight",
                !isOpen && "hidden"
              )}>
                Tenzzen
              </span>
            </Link>
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-transparent"
                onClick={toggle}
              >
                <X className="h-4 w-4 transition-colors hover:text-primary" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pt-2 scrollbar-none">
            <nav className="space-y-3">
              <NavigationGroup items={mainNavigation} />
              <Separator className="my-4" />
              <NavigationGroup items={[...billingNavigation, ...settingsNavigation]} />
            </nav>
          </div>

          <div className="px-4 py-4 space-y-3">
            <div className={cn(
              "group relative rounded-lg py-3 px-3.5 border border-border/50",
              "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent"
            )}>
              <div className="flex items-start gap-2">
                <Crown className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-medium">Upgrade to Pro</p>
                      <span className="text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-px rounded-full">
                        50% OFF
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Get unlimited access to pro features
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="w-full text-xs font-medium bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  >
                    Upgrade Now
                  </Button>
                </div>
              </div>
            </div>

            <div className="px-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs group"
                  >
                    {theme === 'dark' || (theme === 'system' && systemTheme === 'dark') ? (
                      <Moon className="h-3.5 w-3.5 group-hover:text-primary" />
                    ) : theme === 'light' || (theme === 'system' && systemTheme === 'light') ? (
                      <Sun className="h-3.5 w-3.5 group-hover:text-primary" />
                    ) : (
                      <Laptop className="h-3.5 w-3.5 group-hover:text-primary" />
                    )}
                    <span className="ml-2">Theme</span>
                    <span className="ml-auto text-muted-foreground">
                      {theme === 'system'
                        ? `System (${systemTheme === 'dark' ? 'Dark' : 'Light'})`
                        : theme === 'dark' ? 'Dark' : 'Light'
                      }
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px] p-2">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 px-2">
                      Mode
                    </h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex-1 gap-1", theme === 'system' && "bg-accent")}
                        onClick={() => setTheme('system')}
                      >
                        <Laptop className="h-3.5 w-3.5" />
                        <span className="text-xs">System</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex-1 gap-1", theme === 'light' && "bg-accent")}
                        onClick={() => setTheme('light')}
                      >
                        <Sun className="h-3.5 w-3.5" />
                        <span className="text-xs">Light</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex-1 gap-1", theme === 'dark' && "bg-accent")}
                        onClick={() => setTheme('dark')}
                      >
                        <Moon className="h-3.5 w-3.5" />
                        <span className="text-xs">Dark</span>
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator />

            <Button
              variant="ghost"
              className="w-full justify-start px-2 text-xs group"
              onClick={() => setIsSignOutDialogOpen(true)}
            >
              <LogOut className="mr-2 h-3.5 w-3.5 group-hover:text-primary" />
              Sign out
            </Button>

            <AlertDialog open={isSignOutDialogOpen} onOpenChange={setIsSignOutDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign out confirmation</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to sign out of your account?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut} className="bg-primary hover:bg-primary/90">
                    Sign out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </aside>
    </>
  )
}
