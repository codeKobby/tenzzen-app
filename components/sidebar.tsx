"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { SIDEBAR_WIDTH, TRANSITION_DURATION, TRANSITION_TIMING } from "@/lib/constants"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { useAuth } from "@/hooks/use-auth"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const { isOpen, toggle } = useSidebar()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [isMobile, setIsMobile] = React.useState(false)
  const [colorTheme, setColorTheme] = React.useState<'purple' | 'neutral'>('purple')

  React.useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 1024
      setIsMobile(isMobileView)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
        return <Moon className="h-3.5 w-3.5 group-hover:text-primary" />
      case 'system':
        return <Laptop className="h-3.5 w-3.5 group-hover:text-primary" />
      default:
        return <Sun className="h-3.5 w-3.5 group-hover:text-primary" />
    }
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
          )}/>
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
                  {getThemeIcon()}
                  <span className="ml-2">Theme</span>
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
                        className="group"
                        onClick={() => setTheme('light')}
                      >
                        <Sun className="mr-2 h-3.5 w-3.5 group-hover:text-primary" />
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="group"
                        onClick={() => setTheme('dark')}
                      >
                        <Moon className="mr-2 h-3.5 w-3.5 group-hover:text-primary" />
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="group"
                        onClick={() => setTheme('system')}
                      >
                        <Laptop className="mr-2 h-3.5 w-3.5 group-hover:text-primary" />
                        System
                      </DropdownMenuItem>
                    </div>
                  </TabsContent>
                  <TabsContent value="neutral" className="mt-2">
                    <div className="space-y-1">
                      <DropdownMenuItem 
                        className="group"
                        onClick={() => setTheme('light')}
                      >
                        <Sun className="mr-2 h-3.5 w-3.5 group-hover:text-primary" />
                        Light
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="group"
                        onClick={() => setTheme('dark')}
                      >
                        <Moon className="mr-2 h-3.5 w-3.5 group-hover:text-primary" />
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="group"
                        onClick={() => setTheme('system')}
                      >
                        <Laptop className="mr-2 h-3.5 w-3.5 group-hover:text-primary" />
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
