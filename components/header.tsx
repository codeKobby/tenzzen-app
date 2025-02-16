'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Compass } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export function Header() {
  const pathname = usePathname()

  // Only show header on homepage
  if (pathname !== '/') {
    return null
  }

  return (
    <header className="fixed top-0 w-full z-50 px-4">
      <div className="w-[90%] mx-auto mt-4">
        <div className="flex h-14 items-center justify-between bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 rounded-full border px-6 shadow-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
              Tenzzen
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/explore">
                <Compass className="h-4 w-4" />
                Explore
              </Link>
            </Button>
            <Link
              href="/pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/signin">Sign In</Link>
            </Button>
            <Button 
              size="sm"
              asChild
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
          </nav>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            <Button 
              size="sm"
              asChild
              className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
            >
              <Link href="/signup">Get Started</Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem asChild className="flex items-center gap-2 py-3 hover:bg-muted cursor-pointer">
                  <Link href="/explore" className="w-full">
                    <Compass className="h-4 w-4 inline-block mr-2" />
                    Explore
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-3 hover:bg-muted cursor-pointer">
                  <Link href="/pricing" className="w-full">
                    Pricing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-3 hover:bg-muted cursor-pointer">
                  <Link href="/signin" className="w-full">
                    Sign In
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer py-3">
                  <Link href="/signup" className="w-full">
                    Get Started
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
