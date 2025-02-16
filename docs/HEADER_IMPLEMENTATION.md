# Header Implementation with shadcn

## Overview

The header component provides the main navigation bar of the application, implementing responsive design with mobile support using shadcn components.

## Key Components Used

- Sheet (for mobile menu)
- Button
- Avatar
- NavigationMenu
- Separator

## Implementation

```tsx
// app/components/header.tsx
import Link from 'next/link'
import { Menu, X, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

const EXCLUDED_PATHS = ['/signin', '/signup']

export function Header() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  if (EXCLUDED_PATHS.includes(pathname)) {
    return null
  }

  return (
    <header className="fixed top-0 w-full z-50">
      <div className="container">
        <div className="flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <TenzzenLogo className="h-6 w-6" />
            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
              Tenzzen
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {user ? (
              <UserNav />
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Pricing
                </Link>
                <Link
                  href="/signin"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Sign In
                </Link>
                <Button asChild>
                  <Link href="/signup">
                    Try it for free
                  </Link>
                </Button>
              </>
            )}
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" className="md:hidden" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-4 p-4">
                      <Avatar>
                        <AvatarFallback>
                          {user.email?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Free Plan
                        </p>
                      </div>
                    </div>

                    <Separator />

                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 p-4">
                    <Link
                      href="/pricing"
                      className="block text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      Pricing
                    </Link>
                    <Link
                      href="/signin"
                      className="block text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      Sign In
                    </Link>
                    <Button className="w-full" asChild>
                      <Link href="/signup">
                        Try it for free
                      </Link>
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

// User navigation component
function UserNav() {
  return (
    <Button
      variant="ghost"
      onClick={() => signOut()}
      className="flex items-center gap-2"
    >
      <LogOut className="h-4 w-4" />
      Sign Out
    </Button>
  )
}
```

## Key Features

1. **Responsive Design**
   - Desktop: Full navigation menu
   - Mobile: Sheet-based slide-out menu
   - Automatic backdrop blur effect

2. **Authentication States**
   - Handles both authenticated and unauthenticated states
   - Different navigation items based on user status
   - Smooth sign-out functionality

3. **Visual Elements**
   - Gradient text for branding
   - Consistent spacing and typography
   - Proper hover and focus states
   - Smooth transitions

4. **Accessibility**
   - Proper ARIA labels
   - Keyboard navigation support
   - Screen reader optimization
   - Focus management

## Component Usage

```tsx
// In app/layout.tsx
import { Header } from '@/components/header'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  )
}
```

## Style Customization

The header uses the neutral theme tokens and can be customized through:

```css
/* Adjusting header appearance */
.header {
  @apply border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60;
}

/* Logo styling */
.logo {
  @apply bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground;
}

/* Navigation links */
.nav-link {
  @apply text-sm font-medium text-muted-foreground transition-colors hover:text-primary;
}
```

## State Management

The header component manages:
1. Mobile menu state using Sheet component
2. Authentication state via useAuth hook
3. Path-based rendering (excluded paths)
4. Transition states for interactions

This implementation provides a modern, accessible header that integrates seamlessly with Next.js and shadcn components while maintaining the application's design language.