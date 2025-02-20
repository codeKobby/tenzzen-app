"use client"

import * as React from "react"
import { Moon, Sun, Paintbrush } from "lucide-react"
import { useTheme } from "next-themes"
import { useThemePersistence } from "@/hooks/use-theme-persistence"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type ColorTheme = 'purple' | 'neutral' | 'minimal'

export function ThemeToggle() {
  const [mounted, setMounted] = React.useState(false)
  const [colorTheme, setColorTheme] = React.useState<ColorTheme>('purple')
  const { theme } = useTheme()
  const { updateTheme } = useThemePersistence()

  React.useEffect(() => {
    setMounted(true)
    // Initialize theme
    document.documentElement.classList.add('theme-purple')
  }, [])

  const toggleDarkMode = () => {
    updateTheme(theme === 'dark' ? 'light' : 'dark', colorTheme)
  }

  const handleThemeChange = (selectedTheme: ColorTheme) => {
    setColorTheme(selectedTheme)
    document.documentElement.classList.remove('theme-purple', 'theme-neutral', 'theme-minimal')
    document.documentElement.classList.add(`theme-${selectedTheme}`)
    updateTheme(theme || 'system', selectedTheme)
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="ghost" 
        size="icon"
        className="bg-background/80 backdrop-blur-sm border shadow-sm"
        onClick={toggleDarkMode}
      >
        {theme === 'dark' ? (
          <Moon className="h-[1.2rem] w-[1.2rem]" />
        ) : (
          <Sun className="h-[1.2rem] w-[1.2rem]" />
        )}
        <span className="sr-only">Toggle theme</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="bg-background/80 backdrop-blur-sm border shadow-sm"
          >
            <Paintbrush className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Select theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[120px]">
          <DropdownMenuItem 
            onClick={() => handleThemeChange('purple')}
            className={`flex items-center gap-2 px-3 py-1.5 my-1 mx-1 rounded-sm transition-colors ${
              colorTheme === 'purple' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
            }`}
          >
            <Paintbrush className="h-3.5 w-3.5" />
            Purple
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleThemeChange('neutral')}
            className={`flex items-center gap-2 px-3 py-1.5 my-1 mx-1 rounded-sm transition-colors ${
              colorTheme === 'neutral' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
            }`}
          >
            <Paintbrush className="h-3.5 w-3.5" />
            Neutral
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => handleThemeChange('minimal')}
            className={`flex items-center gap-2 px-3 py-1.5 my-1 mx-1 rounded-sm transition-colors ${
              colorTheme === 'minimal' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
            }`}
          >
            <Paintbrush className="h-3.5 w-3.5" />
            Minimal
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
