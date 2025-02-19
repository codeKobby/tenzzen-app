"use client"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/ui/icons"
import { createBrowserClient } from '@supabase/ssr'
import { resetPasswordSchema, getAuthErrorMessage, AUTH_MESSAGES } from "@/lib/validations/auth"
import type { z } from "zod"

type FormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (values: FormData) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/update-password`,
      })

      if (error) {
        // Handle specific error cases
        if (error.message.includes("rate limit")) {
          form.setError("root", {
            type: "manual",
            message: "Too many attempts. Please try again later."
          })
        } else {
          form.setError("root", {
            type: "manual",
            message: getAuthErrorMessage(error)
          })
        }

        toast({
          title: "Error",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        })
        return
      }

      // Clear form after successful submission
      form.reset()
      toast(AUTH_MESSAGES.PASSWORD_RESET_SENT)
      
      // Keep the user on the same page to see the success message
      // They need to check their email for the reset link
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    }
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

        {form.formState.errors.root && (
          <div className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>
    </Form>
  )
}