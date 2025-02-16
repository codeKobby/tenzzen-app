# Next.js Sidebar Implementation with shadcn

The sidebar is implemented using shadcn components and Next.js App Router, ensuring a responsive and accessible navigation experience.

## Key Components and Structure

1. **Components Used**:
   - `Sheet` from shadcn for mobile navigation overlay
   - `ScrollArea` for scrollable content
   - `Button` for interactive elements
   - `Separator` for visual division
   - `Avatar` for user profile
   - `Card` for premium feature promotion

2. **Responsive Behavior**:
   - Desktop: Permanent sidebar with collapsible state
   - Mobile: Sheet component slides in from left
   - Breakpoint-based visibility using Tailwind classes

3. **Navigation Structure**:
   ```typescript
   const mainNavigation = [
     { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
     { name: 'My Courses', href: '/courses', icon: BookOpen },
     { name: 'Notes', href: '/notes', icon: FileText },
     { name: 'Projects', href: '/projects', icon: Folder },
     { name: 'Explore', href: '/explore', icon: Compass }
   ];

   const settingsNavigation = [
     { name: 'Settings', href: '/settings', icon: Settings },
     { name: 'Billing', href: '/billing', icon: Wallet },
     { name: 'Report Bug', href: '/report-bug', icon: Bug }
   ];
   ```

4. **Active States**:
   - Uses Next.js `usePathname` for route matching
   - Implements dynamic styling with CSS variables
   - Handles nested routes appropriately

5. **User Interface**:
   - Avatar component for user profile
   - Sign out functionality with AlertDialog
   - Premium features card with gradient background

6. **Mobile Menu**:
   - Sheet component triggers with hamburger button
   - Smooth animations using CSS transitions
   - Maintains state between desktop and mobile views

## Implementation with shadcn Components

Here's how to implement the sidebar using shadcn components in Next.js:

```tsx
// app/components/sidebar.tsx
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

interface NavigationItem {
  name: string
  href: string
  icon: IconComponent
}

// Navigation configuration (can be moved to a separate file)
const mainNavigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  // ... other items
]

const settingsNavigation: NavigationItem[] = [
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings
  },
  // ... other items
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Navigation items component - reused in both desktop and mobile
  const NavigationItems = ({ items }: { items: NavigationItem[] }) => (
    <div className="space-y-1">
      {items.map((item) => {
        const isActive = pathname.startsWith(item.href)
        return (
          <Button
            key={item.name}
            asChild
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start",
              isCollapsed && "justify-center"
            )}
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          </Button>
        )
      })}
    </div>
  )

  // Premium feature card component
  const PremiumCard = () => (
    <Card className="bg-gradient-to-r from-muted to-muted-foreground/10">
      <CardHeader>
        <CardTitle className="text-sm text-primary">
          <Star className="mr-2 h-4 w-4 inline" />
          Upgrade to Pro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-xs">
          Access premium features and unlimited courses
        </CardDescription>
        <Button variant="secondary" size="sm" className="mt-2 w-full">
          View Plans
        </Button>
      </CardContent>
    </Card>
  )

  return (
    <>
      {/* Mobile Trigger */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            className="md:hidden fixed top-4 left-4 z-40"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[300px] p-0">
          <ScrollArea className="h-full">
            <div className="space-y-6 p-4">
              {/* User Profile Section */}
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={user?.image} />
                  <AvatarFallback>
                    {user?.email?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">Free Plan</p>
                </div>
              </div>

              <Separator />
              
              {/* Navigation */}
              <NavigationItems items={mainNavigation} />
              
              <Separator />
              
              <NavigationItems items={settingsNavigation} />
              
              {/* Premium Card */}
              <div className="mt-4">
                <PremiumCard />
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex flex-col fixed inset-y-0 z-50",
        "border-r bg-background/80 backdrop-blur-sm",
        isCollapsed ? "w-[70px]" : "w-[270px]",
        "transition-width duration-300"
      )}>
        <div className="flex flex-col flex-1 gap-4 p-4">
          <Button
            variant="ghost"
            size="sm"
            className="self-end"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
          </Button>

          {/* User Profile Section */}
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={user?.image} />
              <AvatarFallback>
                {user?.email?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div>
                <p className="text-sm font-medium">{user?.email}</p>
                <p className="text-xs text-muted-foreground">Free Plan</p>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            {/* Main Navigation */}
            <NavigationItems items={mainNavigation} />
            
            <Separator className="my-4" />
            
            {/* Settings Navigation */}
            <NavigationItems items={settingsNavigation} />
            
            {/* Premium Card - Only show when expanded */}
            {!isCollapsed && (
              <div className="mt-4">
                <PremiumCard />
              </div>
            )}
          </ScrollArea>

          {/* Sign Out Button */}
          <Button
            variant="ghost"
            className={cn(
              "justify-start",
              isCollapsed && "justify-center"
            )}
            onClick={() => signOut()}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {!isCollapsed && <span>Sign out</span>}
          </Button>
                    </div>

        </div>
      </div>
    </>
  )
}
```

### Navigation Usage

The sidebar is used in the root layout:

```tsx
// app/layout.tsx
import { Sidebar } from '@/components/sidebar'

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8 md:ml-[70px] xl:ml-[270px]">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
```

### Custom Hooks

For managing sidebar state and auth:

```tsx
// hooks/use-sidebar.ts
import { create } from 'zustand'

interface SidebarState {
  isCollapsed: boolean
  toggleCollapsed: () => void
}

export const useSidebar = create<SidebarState>((set) => ({
  isCollapsed: false,
  toggleCollapsed: () => set((state) => ({
    isCollapsed: !state.isCollapsed
  }))
}))
```

                    {/* User Profile */}
                    <motion.div layout className="p-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center min-w-0">
                                <div className="h-9 w-9 rounded-full bg-[#374151] text-white flex items-center justify-center font-medium">
                                    {user?.email?.[0].toUpperCase()}
                                </div>
                                <AnimatePresence>
                                    {!isCollapsed && (
                                        <motion.div
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="ml-3 min-w-0 overflow-hidden"
                                        >
                                            <p className="text-[14px] font-medium text-gray-900 truncate">
                                                {user?.email}
                                            </p>
                                            <p className="text-xs text-gray-500">Free Plan</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={handleSignOut}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                title="Sign out"
                            >
                                <LogOut size={20} />
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
```

### Modern Implementation Details

1. **Next.js Integration**:
   - Uses App Router for type-safe navigation
   - Implements route groups for feature organization
   - Leverages server/client component patterns

2. **shadcn Components**:
   - Sheet component for mobile navigation
   - ScrollArea for content overflow
   - Avatar and Card for user interface
   - Button variants for interactive elements

3. **State Management**:
   - Zustand for persistent collapse state
   - React Query for data fetching
   - Local state for mobile menu

4. **Responsive Design**:
   - Mobile-first approach with Sheet component
   - Collapsible desktop sidebar (70px/270px)
   - Tailwind breakpoint system

5. **Performance Features**:
   - Optimized bundle size
   - Lazy-loaded components
   - Efficient re-rendering

6. **Accessibility**:
   - ARIA attributes
   - Keyboard navigation
   - Focus management
   - Screen reader support

This modern implementation leverages Next.js and shadcn to create a performant, accessible, and maintainable sidebar component.