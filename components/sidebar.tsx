"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { SIDEBAR_WIDTH, TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { SignOutButton, useClerk } from "@clerk/nextjs"
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
  Paintbrush,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { useThemePersistence } from "@/hooks/use-theme-persistence"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ColorTheme = 'purple' | 'neutral' | 'minimal' | 'modern'
type ThemeMode = 'light' | 'dark' | 'system'

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
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { updateTheme } = useThemePersistence()
  const [isMobile, setIsMobile] = React.useState(false)
  const [colorTheme, setColorTheme] = React.useState<ColorTheme>('purple')
  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>('light')

  // Detect system theme changes
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    updateSystemTheme(mediaQuery) // Initial check
    mediaQuery.addEventListener('change', updateSystemTheme)
    return () => mediaQuery.removeEventListener('change', updateSystemTheme)
  }, [])

  React.useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024
      setIsMobile(isMobileView)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  React.useEffect(() => {
    // Keep color theme in sync with persistence
    const savedColorTheme = document.documentElement.classList.value
      .split(' ')
      .find(className => className.startsWith('theme-'))
      ?.replace('theme-', '') as ColorTheme | undefined

    if (savedColorTheme) {
      setColorTheme(savedColorTheme)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      if (navigator.vibrate) navigator.vibrate([20])
      toast({
        title: "Signed out successfully",
        variant: "default",
      })
      // Redirect user after sign out, e.g., to the login page
      router.push("/login")
    } catch {
      toast({
        title: "Error signing out",
        variant: "destructive",
      })
    }
  }

  const handleThemeChange = (selectedTheme: ColorTheme) => {
    setColorTheme(selectedTheme)
    document.documentElement.classList.remove('theme-purple', 'theme-neutral', 'theme-minimal', 'theme-modern')
    document.documentElement.classList.add(`theme-${selectedTheme}`)
    updateTheme(theme || 'system', selectedTheme)
  }

  const NavigationLink = ({ item }: { item: NavigationItem }) => {
    const isActive = pathname === item.href
    const Icon = item.icon

    return (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center gap-2.5 rounded-lg px-2.5",
          "h-9",
          "transition-all duration-200 ease-out hover:bg-accent/50",
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

  return (
    <aside
      className={cn(
        "border-r bg-card h-screen w-[280px]",
        "z-50 fixed left-0 top-0",
        `transition-transform duration-&lsqb;${TRANSITION_DURATION}ms&rsqb; ${TRANSITION_TIMING}`,
        !isOpen && "-translate-x-full",
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
                    {colorTheme.charAt(0).toUpperCase() + colorTheme.slice(1)}
                    {" • "}
                    {theme === 'system'
                      ? `System (${systemTheme === 'dark' ? 'Dark' : 'Light'})`
                      : theme === 'dark' ? 'Dark' : 'Light'
                    }
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px] p-2">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 px-2">
                      Mode
                    </h4>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex-1 gap-1", theme === 'system' && "bg-accent")}
                        onClick={() => {
                          setTheme('system')
                          updateTheme('system', colorTheme)
                        }}
                      >
                        <Laptop className="h-3.5 w-3.5" />
                        <span className="text-xs">System</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex-1 gap-1", theme === 'light' && "bg-accent")}
                        onClick={() => {
                          setTheme('light')
                          updateTheme('light', colorTheme)
                        }}
                      >
                        <Sun className="h-3.5 w-3.5" />
                        <span className="text-xs">Light</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn("flex-1 gap-1", theme === 'dark' && "bg-accent")}
                        onClick={() => {
                          setTheme('dark')
                          updateTheme('dark', colorTheme)
                        }}
                      >
                        <Moon className="h-3.5 w-3.5" />
                        <span className="text-xs">Dark</span>
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex flex-col gap-2">
                    <h4 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 px-2">
                      Colors
                    </h4>
                    <div className="space-y-1">
                      {(['purple', 'neutral', 'minimal', 'modern'] as const).map((color) => (
                        <DropdownMenuItem
                          key={color}
                          onClick={() => handleThemeChange(color)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-sm transition-colors"
                          data-state={colorTheme === color ? 'active' : undefined}
                        >
                          <Paintbrush className="h-3.5 w-3.5" />
                          {color.charAt(0).toUpperCase() + color.slice(1)}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator />

          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start px-2 text-xs group"
          >
            <LogOut className="mr-2 h-3.5 w-3.5 group-hover:text-primary" />
            Sign out
          </Button>
        </div>
      </div>
    </aside>
  )
}
