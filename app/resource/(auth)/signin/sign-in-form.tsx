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
import { createBrowserClient } from '@supabase/ssr'
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { Separator } from "@/components/ui/separator"
import { signInSchema, getAuthErrorMessage, AUTH_MESSAGES } from "@/lib/validations/auth"
import type { z } from "zod"

type FormData = z.infer<typeof signInSchema>

export function SignInForm() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const form = useForm<FormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (values: FormData) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (error) {
        form.setError("root", {
          type: "manual",
          message: getAuthErrorMessage(error)
        })

        // Handle specific error cases
        if (error.message === "Email not confirmed") {
          toast(AUTH_MESSAGES.VERIFICATION_REQUIRED)
          router.push("/verify-email")
          return
        }

        toast({
          title: "Authentication Error",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        })
        return
      }

      if (data?.user?.email_confirmed_at) {
        toast(AUTH_MESSAGES.SIGN_IN_SUCCESS)
        router.push("/dashboard")
        router.refresh()
      } else {
        toast(AUTH_MESSAGES.VERIFICATION_REQUIRED)
        router.push("/verify-email")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <GoogleSignInButton type="signin" />
      
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

          {form.formState.errors.root && (
            <div className="text-sm font-medium text-destructive">
              {form.formState.errors.root.message}
            </div>
          )}

          <div className="flex items-center justify-end">
            <Button
              variant="link"
              className="px-0 font-normal text-muted-foreground hover:text-primary"
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