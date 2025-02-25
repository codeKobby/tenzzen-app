"use client"

import * as React from "react"
import { Moon, Sun, Paintbrush, Laptop } from "lucide-react"
import { useTheme } from "next-themes"
import { useThemePersistence } from "@/hooks/use-theme-persistence"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type ColorTheme = 'purple' | 'neutral' | 'minimal' | 'modern'
type ThemeMode = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const [colorTheme, setColorTheme] = React.useState<ColorTheme>('purple')
  const { theme, resolvedTheme, setTheme } = useTheme()
  const { updateTheme } = useThemePersistence()
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

  // Initialize theme and mount status
  React.useEffect(() => {
    setMounted(true)
    const savedColorTheme = localStorage.getItem('colorTheme') as ColorTheme
    if (savedColorTheme) {
      setColorTheme(savedColorTheme)
      document.documentElement.classList.remove('theme-purple', 'theme-neutral', 'theme-minimal', 'theme-modern')
      document.documentElement.classList.add(`theme-${savedColorTheme}`)
    } else {
      // Default to purple if no theme is saved
      localStorage.setItem('colorTheme', 'purple')
      document.documentElement.classList.add('theme-purple')
    }
  }, [])

  const handleThemeChange = (selectedTheme: ColorTheme) => {
    setColorTheme(selectedTheme)
    document.documentElement.classList.remove('theme-purple', 'theme-neutral', 'theme-minimal', 'theme-modern')
    document.documentElement.classList.add(`theme-${selectedTheme}`)
    updateTheme(theme || 'system', selectedTheme)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-background/80 backdrop-blur-sm border shadow-sm"
          >
            <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Colors</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[140px] p-2">
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
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="bg-background/80 backdrop-blur-sm border shadow-sm"
          >
            {theme === 'dark' || (theme === 'system' && systemTheme === 'dark') ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : theme === 'light' || (theme === 'system' && systemTheme === 'light') ? (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Laptop className="h-[1.2rem] w-[1.2rem]" />
            )}
            <span className="sr-only">Theme</span>
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
  )
}
