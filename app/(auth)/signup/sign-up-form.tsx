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
import { signUpSchema, getAuthErrorMessage, AUTH_MESSAGES } from "@/lib/validations/auth"
import { PasswordStrengthMeter } from "@/components/password-strength-meter"
import type { z } from "zod"

type FormData = z.infer<typeof signUpSchema>

export function SignUpForm() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const form = useForm<FormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onChange" // Enable real-time validation
  })

  const onSubmit = async (values: FormData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })

      if (error) {
        // Handle specific error cases
        if (error.message === "User already registered") {
          form.setError("email", {
            type: "manual",
            message: "An account with this email already exists"
          })
        } else {
          form.setError("root", {
            type: "manual",
            message: getAuthErrorMessage(error)
          })
        }

        toast({
          title: "Sign Up Error",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        })
        return
      }

      // Handle email confirmation requirement
      if (data?.user && !data.user.email_confirmed_at) {
        toast(AUTH_MESSAGES.SIGN_UP_SUCCESS)
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
    <div className="space-y-4">
      <GoogleSignInButton type="signup" />

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                {form.getValues("password") && !form.formState.errors.password && (
                  <div className="mt-2">
                    <PasswordStrengthMeter password={form.getValues("password")} />
                  </div>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <FormMessage>{form.formState.errors.root.message}</FormMessage>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={form.formState.isSubmitting || !form.formState.isValid}
          >
            {form.formState.isSubmitting ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </Link>
          </p>
        </form>
      </Form>
    </div>
  )
}