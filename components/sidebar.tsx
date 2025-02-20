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
  FolderKanban,
  Crown,
  Sun,
  Moon,
  Laptop
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
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

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

export function Sidebar({ children, className }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, toggle } = useSidebar()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isMobile, setIsMobile] = React.useState(false)
  const [colorTheme, setColorTheme] = React.useState<'purple' | 'neutral'>('purple')

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
      await signOut()
      if (navigator.vibrate) navigator.vibrate([20])
      toast({
        title: "Signed out successfully",
        variant: "default",
      })
    } catch {
      toast({
        title: "Error signing out",
        variant: "destructive",
      })
    }
  }

  const handleThemeChange = (selectedTheme: 'purple' | 'neutral') => {
    setColorTheme(selectedTheme)
    document.documentElement.classList.remove('theme-purple', 'theme-neutral')
    document.documentElement.classList.add(`theme-${selectedTheme}`)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="mr-2 h-3.5 w-3.5" />
      case 'system':
        return <Laptop className="mr-2 h-3.5 w-3.5" />
      default:
        return <Sun className="mr-2 h-3.5 w-3.5" />
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

  return (
    <div className="relative">
      {/* Mobile Toggle */}
      {!isOpen && isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed left-4 top-4 z-50 h-9 w-9"
          onClick={toggle}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}

      {/* Desktop Toggle */}
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "fixed top-4 z-50 h-9 w-9 hidden lg:flex",
          isOpen ? "left-[200px]" : "left-[0px]"
        )}
        onClick={toggle}
      >
        <ChevronLeft className={cn(
          "h-4 w-4 transition-transform duration-200",
          !isOpen && "rotate-180"
        )} />
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-[100dvh] flex-col border-r bg-card overflow-hidden",
          "w-[240px] transition-[width,transform] duration-300 ease-in-out",
          !isOpen && (isMobile ? "-translate-x-full" : "w-0"),
          className
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 shrink-0 text-primary" />
              <span className={cn(
                "text-base font-bold tracking-tight text-foreground transition-opacity duration-300",
                !isOpen && "lg:hidden"
              )}>
                Tenzzen
              </span>
            </div>
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

          <div className="no-scrollbar flex flex-1 flex-col overflow-y-auto px-3 py-2">
            <nav className="space-y-4">
              <NavigationGroup items={mainNavigation} />
              <Separator className="my-4" />
              <NavigationGroup items={[...billingNavigation, ...settingsNavigation]} />
            </nav>
          </div>

          <div className="px-3 py-4 space-y-4">
            <div className={cn(
              "flex items-center gap-2 rounded-md bg-accent/50 p-3",
              "transition-all duration-200"
            )}>
              <Crown className="h-4 w-4 text-yellow-500" />
              <div className="flex-1">
                <p className="text-xs font-medium">Upgrade to Pro</p>
                <p className="text-[10px] text-muted-foreground">Get unlimited access</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleNavigation()}
              >
                Upgrade
              </Button>
            </div>

            <div className="px-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs"
                  >
                    {getThemeIcon()}
                    Theme
                    <span className="ml-auto text-muted-foreground">
                      {colorTheme === 'purple' ? 'Purple' : 'Neutral'}
                      {" / "}
                      {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[240px] p-2">
                  <Tabs 
                    defaultValue={colorTheme} 
                    className="w-full" 
                    onValueChange={(value) => handleThemeChange(value as 'purple' | 'neutral')}
                  >
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="purple" className="text-xs">Purple</TabsTrigger>
                      <TabsTrigger value="neutral" className="text-xs">Neutral</TabsTrigger>
                    </TabsList>
                    <TabsContent value="purple" className="mt-2">
                      <div className="space-y-1">
                        <DropdownMenuItem 
                          onClick={() => setTheme('light')}
                          className={theme === 'light' ? "bg-accent" : undefined}
                        >
                          <Sun className="mr-2 h-3.5 w-3.5" />
                          Light
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme('dark')}
                          className={theme === 'dark' ? "bg-accent" : undefined}
                        >
                          <Moon className="mr-2 h-3.5 w-3.5" />
                          Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme('system')}
                          className={theme === 'system' ? "bg-accent" : undefined}
                        >
                          <Laptop className="mr-2 h-3.5 w-3.5" />
                          System
                        </DropdownMenuItem>
                      </div>
                    </TabsContent>
                    <TabsContent value="neutral" className="mt-2">
                      <div className="space-y-1">
                        <DropdownMenuItem 
                          onClick={() => setTheme('light')}
                          className={theme === 'light' ? "bg-accent" : undefined}
                        >
                          <Sun className="mr-2 h-3.5 w-3.5" />
                          Light
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme('dark')}
                          className={theme === 'dark' ? "bg-accent" : undefined}
                        >
                          <Moon className="mr-2 h-3.5 w-3.5" />
                          Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTheme('system')}
                          className={theme === 'system' ? "bg-accent" : undefined}
                        >
                          <Laptop className="mr-2 h-3.5 w-3.5" />
                          System
                        </DropdownMenuItem>
                      </div>
                    </TabsContent>
                  </Tabs>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Separator />

            <Button
              variant="ghost"
              onClick={handleSignOut}
              className="w-full justify-start px-2 text-xs"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>

      <main className={cn(
        "min-h-screen transition-[margin] duration-300 ease-in-out",
        isOpen ? "ml-[240px]" : "ml-0"
      )}>
        {children}
      </main>
    </div>
  )
}
