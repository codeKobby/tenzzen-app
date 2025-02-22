'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Compass, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
    router.push('/')
  }

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
            <span className="font-bold text-xl text-foreground">
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
            {user ? (
              <>
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                  asChild
                >
                  <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/signin">Sign In</Link>
                </Button>
                <Button 
                  size="sm"
                  asChild
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
                >
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Navigation */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <Button 
                size="sm"
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            ) : (
              <Button 
                size="sm"
                asChild
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-8 p-0 data-[state=open]:bg-accent/50"
                >
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-52 p-2"
                align="end"
                side="bottom"
                sideOffset={8}
                alignOffset={0}
              >
                <DropdownMenuItem asChild className="focus:bg-accent">
                  <Link href="/explore" className="w-full flex items-center py-2 px-3 hover:bg-accent rounded-md">
                    <Compass className="h-4 w-4 mr-2" />
                    Explore
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-accent">
                  <Link href="/pricing" className="w-full flex items-center py-2 px-3 hover:bg-accent rounded-md">
                    Pricing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user ? (
                  <>
                    <DropdownMenuItem asChild className="focus:bg-primary">
                      <Link href="/dashboard" className="w-full flex items-center py-2 px-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium">
                        Back to Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="focus:bg-accent"
                    >
                      <span className="w-full flex items-center py-2 px-3 hover:bg-accent rounded-md">
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild className="focus:bg-accent">
                      <Link href="/signin" className="w-full flex items-center py-2 px-3 hover:bg-accent rounded-md">
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="focus:bg-primary">
                      <Link href="/signup" className="w-full flex items-center py-2 px-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium">
                        Get Started
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
