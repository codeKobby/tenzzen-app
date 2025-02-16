# Theme Implementation

## 1. Dark/Light Theme Support

### Theme Configuration
```typescript
// lib/theme-config.ts
interface ThemeConfig {
  light: {
    background: string;
    foreground: string;
    card: string;
    'card-foreground': string;
    popover: string;
    'popover-foreground': string;
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    muted: string;
    'muted-foreground': string;
    accent: string;
    'accent-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    border: string;
    input: string;
    ring: string;
  };
  dark: {
    background: string;
    foreground: string;
    card: string;
    'card-foreground': string;
    popover: string;
    'popover-foreground': string;
    primary: string;
    'primary-foreground': string;
    secondary: string;
    'secondary-foreground': string;
    muted: string;
    'muted-foreground': string;
    accent: string;
    'accent-foreground': string;
    destructive: string;
    'destructive-foreground': string;
    border: string;
    input: string;
    ring: string;
  };
}

export const themeConfig: ThemeConfig = {
  light: {
    background: 'hsl(0 0% 100%)',
    foreground: 'hsl(224 71.4% 4.1%)',
    card: 'hsl(0 0% 100%)',
    'card-foreground': 'hsl(224 71.4% 4.1%)',
    popover: 'hsl(0 0% 100%)',
    'popover-foreground': 'hsl(224 71.4% 4.1%)',
    primary: 'hsl(262.1 83.3% 57.8%)',
    'primary-foreground': 'hsl(210 20% 98%)',
    secondary: 'hsl(220 14.3% 95.9%)',
    'secondary-foreground': 'hsl(220.9 39.3% 11%)',
    muted: 'hsl(220 14.3% 95.9%)',
    'muted-foreground': 'hsl(220 8.9% 46.1%)',
    accent: 'hsl(220 14.3% 95.9%)',
    'accent-foreground': 'hsl(220.9 39.3% 11%)',
    destructive: 'hsl(0 84.2% 60.2%)',
    'destructive-foreground': 'hsl(210 20% 98%)',
    border: 'hsl(220 13% 91%)',
    input: 'hsl(220 13% 91%)',
    ring: 'hsl(262.1 83.3% 57.8%)',
  },
  dark: {
    background: 'hsl(224 71.4% 4.1%)',
    foreground: 'hsl(210 20% 98%)',
    card: 'hsl(224 71.4% 4.1%)',
    'card-foreground': 'hsl(210 20% 98%)',
    popover: 'hsl(224 71.4% 4.1%)',
    'popover-foreground': 'hsl(210 20% 98%)',
    primary: 'hsl(263.4 70% 50.4%)',
    'primary-foreground': 'hsl(210 20% 98%)',
    secondary: 'hsl(215 27.9% 16.9%)',
    'secondary-foreground': 'hsl(210 20% 98%)',
    muted: 'hsl(215 27.9% 16.9%)',
    'muted-foreground': 'hsl(217.9 10.6% 64.9%)',
    accent: 'hsl(215 27.9% 16.9%)',
    'accent-foreground': 'hsl(210 20% 98%)',
    destructive: 'hsl(0 62.8% 30.6%)',
    'destructive-foreground': 'hsl(210 20% 98%)',
    border: 'hsl(215 27.9% 16.9%)',
    input: 'hsl(215 27.9% 16.9%)',
    ring: 'hsl(263.4 70% 50.4%)'
  }
};
```

### Theme Provider Implementation
```tsx
// lib/theme-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
}>({
  theme: 'system',
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### Theme Toggle Component
```tsx
// components/theme-toggle.tsx
'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 2. Global Theme Style

```css
/* styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: theme('colors.white');
    --foreground: theme('colors.gray.900');
    /* ... other light theme variables */
  }

  .dark {
    --background: theme('colors.gray.900');
    --foreground: theme('colors.gray.50');
    /* ... other dark theme variables */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## 3. Component Theme Integration

### Card Component Example
```tsx
// components/ui/card.tsx
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm dark:border-gray-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

### Button Component Example
```tsx
// components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function Button({ variant = 'default', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50 disabled:pointer-events-none",
        {
          'bg-primary text-primary-foreground hover:bg-primary/90 dark:hover:bg-primary/80':
            variant === 'default',
          'bg-destructive text-destructive-foreground hover:bg-destructive/90':
            variant === 'destructive',
          'border border-input hover:bg-accent hover:text-accent-foreground':
            variant === 'outline',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80':
            variant === 'secondary',
          'hover:bg-accent hover:text-accent-foreground':
            variant === 'ghost',
          'underline-offset-4 hover:underline text-primary':
            variant === 'link',
        },
        className
      )}
      {...props}
    />
  );
}
```

## 4. Theme Auto-Detection

```typescript
// lib/theme-utils.ts
export function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'light';
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function listenForThemeChange(callback: (theme: 'dark' | 'light') => void) {
  if (typeof window === 'undefined') return () => {};
  
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const listener = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light');
  };
  
  mediaQuery.addEventListener('change', listener);
  return () => mediaQuery.removeEventListener('change', listener);
}
```

This implementation ensures consistent theme support across the application, with proper dark mode implementation and system theme detection.