"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/hooks/use-sidebar"
import { useAuth } from "@/hooks/use-auth"
import {
  BarChart2,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Target,
  Trophy,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface NavigationItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "My Courses",
    href: "/dashboard/courses",
    icon: BookOpen,
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart2,
  },
  {
    title: "Learning Path",
    href: "/dashboard/path",
    icon: GraduationCap,
  },
  {
    title: "Goals",
    href: "/dashboard/goals",
    icon: Target,
  },
  {
    title: "Achievements",
    href: "/dashboard/achievements",
    icon: Trophy,
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen } = useSidebar()
  const { signOut } = useAuth()

  return (
    <aside
      className={cn(
        "flex h-screen w-64 flex-col border-r bg-card px-4 py-6",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "fixed left-0 top-0 z-40 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
        className
      )}
    >
      <div className="flex items-center gap-2 px-2">
        <GraduationCap className="h-8 w-8" />
        <span className="text-xl font-bold">Tenzzen</span>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <Button
          variant="ghost"
          onClick={() => signOut()}
          className="flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
