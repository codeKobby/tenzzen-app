# Authentication Pages Implementation with shadcn

## Overview

Implementation of standalone authentication pages (Sign In, Sign Up, Reset Password) using shadcn components and Next.js App Router.

## Implementation

### Sign In Page

```tsx
// app/(auth)/signin/page.tsx
import { SignInForm } from "./sign-in-form"
import { TenzzenLogo } from "@/components/tenzzen-logo"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8">
          {/* Back Button */}
          <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>

          {/* Logo and Title */}
          <div className="text-center mb-8">
            <TenzzenLogo className="w-12 h-12 mx-auto mb-4" />
            <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to your account to continue
            </p>
          </div>

          {/* OAuth Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signIn("google")}
          >
            <svg className="mr-2 h-4 w-4" aria-hidden="true" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          <SignInForm />

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-primary underline-offset-4 hover:underline"
            >
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

// app/(auth)/signin/sign-in-form.tsx
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const formSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export function SignInForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    })

    if (result?.error) {
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive",
      })
      return
    }

    router.push("/dashboard")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="name@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-end">
          <Link
            href="/reset-password"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" className="w-full">
          {form.formState.isSubmitting && (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          )}
          Sign in
        </Button>
      </form>
    </Form>
  )
}
```

## Features

1. **Clean, Minimal UI**
   - Professional layout
   - Clear visual hierarchy
   - Consistent spacing
   - Proper form organization

2. **Form Features**
   - Zod validation
   - Error handling
   - Loading states
   - Password strength
   - Field requirements

3. **Authentication Flow**
   - Google OAuth
   - Email/Password
   - Password reset
   - Sign up redirect
   - Success/error feedback

4. **User Experience**
   - Form validation
   - Loading indicators
   - Error messages
   - Clear CTAs
   - Easy navigation

## Usage

The authentication pages are automatically handled by Next.js App Router:

```tsx
// app/(auth)/layout.tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {children}
    </div>
  )
}
```

## State Management

1. **Form State**
   - Uses React Hook Form
   - Zod validation schema
   - Loading states
   - Error handling

2. **Authentication State**
   - Next Auth session
   - Protected routes
   - Redirects
   - Persistence

3. **Loading States**
   - Form submission
   - OAuth processing
   - Route transitions
   - Error recovery

## Styling

The authentication pages use shadcn's neutral theme with subtle customizations:

```tsx
// Gradient background
className="bg-gradient-to-b from-background to-muted/30"

// Card styling
className="bg-card rounded-xl shadow-lg"

// Button variants
variant="outline" // For OAuth
variant="default" // For primary actions

// Text styles
className="text-muted-foreground" // Secondary text
className="text-primary" // Links and CTAs
```

This implementation provides a clean, professional authentication experience that integrates seamlessly with Next.js and shadcn components.