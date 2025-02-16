"use client"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { Icons } from "@/components/ui/icons"
import { createBrowserClient } from '@supabase/ssr'
import { updatePasswordSchema, getAuthErrorMessage, AUTH_MESSAGES } from "@/lib/validations/auth"
import type { z } from "zod"

type FormData = z.infer<typeof updatePasswordSchema>

export function UpdatePasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const token_hash = searchParams.get('token_hash') || ''
  const type = searchParams.get('type') || ''

  const form = useForm<FormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange"
  })

  const onSubmit = async (values: FormData) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.password,
        token_hash: token_hash,
        type: type as any,
      })


      if (error) {
        form.setError("root", {
          type: "manual",
          message: getAuthErrorMessage(error)
        })
        toast({
          title: "Error",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        })
        return
      }

      toast(AUTH_MESSAGES.PASSWORD_RESET_SUCCESS)
      router.push("/signin")
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
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
              {form.getValues("password") && !form.formState.errors.password && (
                <p className="text-xs text-muted-foreground">
                  Password must contain at least 8 characters, one uppercase letter,
                  one lowercase letter, one number, and one special character.
                </p>
              )}
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
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
              Updating password...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </form>
    </Form>
  )
}