"use client"

import * as React from "react"
import * as Clerk from "@clerk/elements/common"
import * as SignIn from "@clerk/elements/sign-in"
import { cn } from "@/lib/utils"

export default function SignInPage() {
  return (
    <div className="grid w-full flex-grow items-center bg-background px-4 sm:justify-center">
      <SignIn.Root>
        <SignIn.Step name="start" className="w-full space-y-6 sm:w-96">
          <header className="text-center">
            <h1 className="text-xl font-medium tracking-tight">Sign in to your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back! Please sign in to continue.
            </p>
          </header>

          <div className="grid gap-4">
            <Clerk.Connection
              name="google"
              className={cn(
                "flex items-center justify-center gap-x-2 rounded-lg",
                "bg-primary/10 px-4 py-2 text-sm font-medium text-primary",
                "hover:bg-primary/20 active:bg-primary/30",
                "ring-1 ring-inset ring-primary/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
            >
              <Clerk.Icon className="h-4 w-4" /> Sign in with Google
            </Clerk.Connection>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Clerk.Field name="identifier" className="group/field relative space-y-2">
              <Clerk.Label className="text-sm font-medium">Email</Clerk.Label>
              <Clerk.Input 
                className={cn(
                  "flex w-full rounded-lg bg-background px-3 py-2 text-sm",
                  "ring-1 ring-inset ring-input",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "data-[invalid]:ring-destructive"
                )}
              />
              <Clerk.FieldError className="text-sm text-destructive" />
            </Clerk.Field>

            <Clerk.Field name="password" className="group/field relative space-y-2">
              <Clerk.Label className="text-sm font-medium">Password</Clerk.Label>
              <Clerk.Input 
                type="password"
                className={cn(
                  "flex w-full rounded-lg bg-background px-3 py-2 text-sm",
                  "ring-1 ring-inset ring-input",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "data-[invalid]:ring-destructive"
                )}
              />
              <Clerk.FieldError className="text-sm text-destructive" />
            </Clerk.Field>
          </div>

          <SignIn.Action
            submit
            className={cn(
              "w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
              "hover:bg-primary/90 active:bg-primary/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            )}
          >
            Sign In
          </SignIn.Action>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Clerk.Link
              navigate="sign-up"
              className={cn(
                "font-medium text-primary",
                "hover:text-primary/90",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              )}
            >
              Sign up
            </Clerk.Link>
          </p>
        </SignIn.Step>

        <SignIn.Step name="verifications" className="w-full space-y-6 sm:w-96">
          <SignIn.Strategy name="email_code">
            <header className="text-center">
              <h1 className="text-xl font-medium tracking-tight">Check your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a verification code to <SignIn.SafeIdentifier />
              </p>
            </header>

            <Clerk.Field name="code" className="group/field relative space-y-2">
              <Clerk.Label className="text-sm font-medium">Verification Code</Clerk.Label>
              <Clerk.Input 
                type="otp"
                className={cn(
                  "flex w-full rounded-lg bg-background px-3 py-2 text-sm",
                  "ring-1 ring-inset ring-input",
                  "placeholder:text-muted-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  "data-[invalid]:ring-destructive"
                )}
              />
              <Clerk.FieldError className="text-sm text-destructive" />
            </Clerk.Field>

            <SignIn.Action
              submit
              className={cn(
                "w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
                "hover:bg-primary/90 active:bg-primary/80",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              )}
            >
              Verify
            </SignIn.Action>
          </SignIn.Strategy>
        </SignIn.Step>
      </SignIn.Root>
    </div>
  )
}