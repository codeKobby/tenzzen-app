# Tenzzen Design System

## Core Theme Principles

### 1. Theme Configuration
- All components MUST use CSS variables defined in theme config
- Both light and dark themes MUST be supported
- System theme detection MUST be implemented
- Theme switching MUST be smooth and accessible

### 2. Color Tokens
| Token Name | Light Theme | Dark Theme | Usage |
|------------|-------------|------------|-------|
| background | `hsl(0 0% 100%)` | `hsl(224 71.4% 4.1%)` | Page backgrounds |
| foreground | `hsl(224 71.4% 4.1%)` | `hsl(210 20% 98%)` | Primary text |
| card | `hsl(0 0% 100%)` | `hsl(224 71.4% 4.1%)` | Card backgrounds |
| muted | `hsl(220 14.3% 95.9%)` | `hsl(215 27.9% 16.9%)` | Subtle backgrounds |
| primary | `hsl(262.1 83.3% 57.8%)` | `hsl(263.4 70% 50.4%)` | Primary actions |
| secondary | `hsl(220 14.3% 95.9%)` | `hsl(215 27.9% 16.9%)` | Secondary elements |
| border | `hsl(220 13% 91%)` | `hsl(215 27.9% 16.9%)` | Borders |
| ring | `hsl(262.1 83.3% 57.8%)` | `hsl(263.4 70% 50.4%)` | Focus rings |

### 3. Typography
- Font Family: Inter
- Base size: 16px (1rem)
- Scale:
  ```css
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  ```

### 4. Spacing
```css
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem;  /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem;    /* 16px */
--space-6: 1.5rem;  /* 24px */
--space-8: 2rem;    /* 32px */
--space-12: 3rem;   /* 48px */
--space-16: 4rem;   /* 64px */
```

## Component Library

### 1. Core Components

#### Button
```tsx
<Button
  variant="default" // default | destructive | outline | secondary | ghost | link
  size="default"    // default | sm | lg | icon
  className="..."   // custom classes
>
  Button Text
</Button>
```

Dark Theme Support:
```css
.button {
  @apply bg-primary text-primary-foreground hover:bg-primary/90;
  @apply dark:hover:bg-primary/80;
}
```

#### Card
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

Dark Theme Support:
```css
.card {
  @apply bg-card text-card-foreground border;
  @apply dark:border-gray-800;
}
```

### 2. Form Components

#### Input
```tsx
<Input
  type="text"
  placeholder="Enter text"
  className="..."
/>
```

Dark Theme Support:
```css
.input {
  @apply bg-background border-input;
  @apply dark:bg-gray-950 dark:border-gray-800;
}
```

#### Select
```tsx
<Select>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem>Option</SelectItem>
  </SelectContent>
</Select>
```

### 3. Feedback Components

#### Alert
```tsx
<Alert variant="default">
  <AlertTitle>Title</AlertTitle>
  <AlertDescription>Description</AlertDescription>
</Alert>
```

#### Toast
```tsx
toast({
  title: "Title",
  description: "Description",
  variant: "default"
})
```

## Implementation Rules

### 1. Theme Integration
- MUST use `useTheme` hook for theme switching
- MUST implement dark mode variants
- MUST support system theme preference
- MUST provide smooth theme transitions

### 2. Component Usage
- MUST use shadcn components from `@/components/ui`
- MUST include proper dark mode classes
- MUST handle loading states with Skeleton
- MUST implement focus states

### 3. Responsive Design
- MUST use Tailwind breakpoints
- MUST support both light and dark themes at all sizes
- MUST maintain contrast ratios in both themes

### 4. Accessibility
- MUST maintain WCAG 2.1 AA compliance
- MUST support keyboard navigation
- MUST include proper ARIA attributes
- MUST ensure sufficient color contrast in both themes

## Style Enforcement

### 1. CSS Rules
- NO custom colors outside theme tokens
- NO direct CSS except for complex animations
- MUST use CSS variables for theme values
- MUST include dark mode variants

### 2. Component Rules
- ALL components must extend from shadcn base
- ALL interactive elements must have hover/focus states
- ALL components must support both themes
- NO inline styles

### 3. Theme Rules
- MUST use theme context for state
- MUST persist theme preference
- MUST support system preference
- MUST implement smooth transitions

This design system ensures consistent styling and proper theme support across the application.