"use client"

import Link from "next/link"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/ui/icons"
import { useAuth } from "@/hooks/use-auth"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { Separator } from "@/components/ui/separator"
import { signInSchema, getAuthErrorMessage, AUTH_MESSAGES } from "@/lib/validations/auth"
import type { z } from "zod"
import React from "react"

type FormData = z.infer<typeof signInSchema>

export function SignInForm() {
  const [isLoading, setIsLoading] = React.useState(false)
  const router = useRouter()
  const { signIn } = useAuth()

  const form = useForm<FormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: FormData) => {
    try {
      const { data, error } = await signIn(values.email, values.password)

      if (error?.message) {
        // Handle verification required case
        if (error.message === "Email not confirmed") {
          toast({
            ...AUTH_MESSAGES.VERIFICATION_REQUIRED
          })
          router.push("/verify-email")
          return
        }

        // Show invalid credentials and other auth errors as toasts
        const errorMessage = getAuthErrorMessage(error)
        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      // Handle successful authentication
      if (data?.user && data.user.email_confirmed_at) {
        toast({
          ...AUTH_MESSAGES.SIGN_IN_SUCCESS
        })
        router.push("/dashboard")
        router.refresh()
      } else {
        // Handle unverified email case
        toast({
          ...AUTH_MESSAGES.VERIFICATION_REQUIRED
        })
        router.push("/verify-email")
      }
    } catch (error) {
      console.error('Sign in error:', error)
      toast({
        title: "Sign In Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <GoogleSignInButton isLoading={isLoading} setIsLoading={setIsLoading} />

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>

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
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
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
                  <Input
                    type="password"
                    autoComplete="current-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end">
            <Button
              variant="link"
              className="px-0 font-medium text-primary hover:text-primary/90"
              asChild
            >
              <Link href="/reset-password">
                Forgot your password?
              </Link>
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>
    </div>
  )
}
