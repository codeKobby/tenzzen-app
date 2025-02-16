"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/ui/logo"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { 
  LayoutDashboard,
  BookOpen,
  FileText,
  Folder,
  Compass,
  Settings,
  Wallet,
  Bug,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { useAuth } from "@/hooks/use-auth"

interface NavigationItem {
  name: string
  href: string
  icon: React.ElementType
  isPremium?: boolean
}

const mainNavigation: NavigationItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Generate", href: "/generate", icon: Sparkles },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Collections", href: "/collections", icon: Folder },
  { name: "Explore", href: "/explore", icon: Compass, isPremium: true }
]

const secondaryNavigation: NavigationItem[] = [
  { name: "Account", href: "/account", icon: Wallet },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: Bug }
]

function NavigationItems({ items }: { items: NavigationItem[] }) {
  const pathname = usePathname()
  const { isCollapsed } = useSidebar()
  const { user } = useAuth()
  
  return (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href)
        const button = (
          <Button
            key={item.name}
            asChild
            variant="ghost"
            className={cn(
              "w-full justify-start h-10 hover:bg-accent/50",
              isCollapsed && "justify-center px-0",
              isActive && "bg-accent font-medium text-accent-foreground hover:bg-accent/90"
            )}
          >
            <Link href={item.isPremium && !user?.isPremium ? "/account" : item.href}>
              <item.icon className={cn(
                "h-4 w-4 shrink-0",
                isCollapsed ? "mx-0" : "mr-3",
                isActive ? "text-accent-foreground" : "text-muted-foreground"
              )} />
              {!isCollapsed && (
                <div className="flex items-center gap-1.5 text-sm truncate">
                  <span>{item.name}</span>
                  {item.isPremium && !user?.isPremium && (
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
              )}
            </Link>
          </Button>
        )

        if (item.isPremium && !user?.isPremium) {
          return (
            <div key={item.name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  {button}
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  align="center"
                  alignOffset={-8}
                  className="font-medium text-xs"
                >
                  ✨ Premium Feature
                </TooltipContent>
              </Tooltip>
            </div>
          )
        }

        return <div key={item.name}>{button}</div>
      })}
    </div>
  )
}

function SidebarFooter() {
  const { isCollapsed } = useSidebar()
  const { user, signOut } = useAuth()
  
  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0 h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium ring-1 ring-primary/20">
              {user?.email.charAt(0).toUpperCase() ?? 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-medium truncate">{user?.email ?? 'user@example.com'}</p>
                  {!user?.isPremium && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/account">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 text-muted-foreground hover:text-primary"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="right"
                        align="center"
                        className="font-medium text-xs"
                      >
                        ✨ Go Premium
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {user?.isPremium ? 'Premium Plan' : 'Free Plan'}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && <ThemeToggle />}
        </div>
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className={cn(
            "justify-start gap-2 h-10 hover:bg-destructive/10 hover:text-destructive",
            isCollapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 text-muted-foreground" />
          {!isCollapsed && <span>Sign out</span>}
        </Button>
      </div>
    </div>
  )
}

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { isCollapsed, toggleCollapsed } = useSidebar()

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden fixed left-4 top-3 h-10 w-10 px-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0">
          <div className="flex flex-col h-full">
            <div className="flex-1">
              <div className="flex h-[60px] items-center px-6">
                <Logo />
              </div>
              <ScrollArea className="flex-1 overflow-hidden">
                <div className="flex flex-col gap-4 p-4">
                  <NavigationItems items={mainNavigation} />
                  <Separator />
                  <NavigationItems items={secondaryNavigation} />
                </div>
              </ScrollArea>
            </div>
            <SidebarFooter />
          </div>
        </SheetContent>
      </Sheet>
      <aside className={cn(
        "fixed left-0 top-0 z-30 hidden h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        isCollapsed ? "w-[70px]" : "w-[270px]",
        "transition-width duration-300 ease-in-out md:flex flex-col",
        className
      )}>
        <div className="flex-1">
          <div className="flex h-[60px] items-center px-6">
            <Logo />
          </div>
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="flex flex-col gap-4 p-4">
              <NavigationItems items={mainNavigation} />
              <Separator />
              <NavigationItems items={secondaryNavigation} />
            </div>
          </ScrollArea>
        </div>
        <div className="absolute right-[-14px] top-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={toggleCollapsed} 
                  variant="secondary"
                  className="h-7 w-7 p-0 rounded-full"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronLeft className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                {isCollapsed ? 'Expand' : 'Collapse'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <SidebarFooter />
      </aside>
    </>
  )
}
