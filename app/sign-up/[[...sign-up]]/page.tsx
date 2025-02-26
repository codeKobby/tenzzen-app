"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import * as Clerk from "@clerk/elements/common"
import * as SignUp from "@clerk/elements/sign-up"
import { cn } from "@/lib/utils"

export default function SignUpPage() {
  return (
    <div className="container relative h-[100vh] flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <Link
        href="/"
        className="absolute left-4 top-4 flex items-center text-sm font-medium text-muted-foreground hover:text-foreground md:left-8 md:top-8"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Link>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-primary" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 mr-2" />
          Tenzzen
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Join our community of learners and start your journey towards mastery. Access expert-led courses, hands-on projects, and connect with fellow learners.&rdquo;
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="p-4 lg:p-8 h-full flex items-center">
        <SignUp.Root>
          <SignUp.Step name="start" className="w-full space-y-6 sm:w-[350px] mx-auto">
            <div className="flex flex-col space-y-2 text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
              <p className="text-sm text-muted-foreground">
                Enter your details to get started
              </p>
            </div>

            <div className="grid gap-6">
              <Clerk.Connection
                name="google"
                className={cn(
                  "flex items-center justify-center gap-x-2 rounded-lg",
                  "bg-background px-4 py-2.5 text-sm font-medium text-foreground",
                  "hover:bg-muted transition-colors",
                  "ring-1 ring-inset ring-input",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
              >
                <Clerk.Icon className="h-4 w-4" /> Continue with Google
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

              <div className="grid gap-4">
                <Clerk.Field name="emailAddress" className="grid gap-2">
                  <Clerk.Label className="text-sm font-medium">Email</Clerk.Label>
                  <Clerk.Input 
                    className={cn(
                      "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm",
                      "ring-1 ring-inset ring-input",
                      "placeholder:text-muted-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "data-[invalid]:ring-destructive"
                    )}
                    placeholder="name@example.com"
                  />
                  <Clerk.FieldError className="text-sm font-medium text-destructive" />
                </Clerk.Field>

                <Clerk.Field name="username" className="grid gap-2">
                  <Clerk.Label className="text-sm font-medium">Username</Clerk.Label>
                  <Clerk.Input 
                    className={cn(
                      "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm",
                      "ring-1 ring-inset ring-input",
                      "placeholder:text-muted-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "data-[invalid]:ring-destructive"
                    )}
                    placeholder="username"
                  />
                  <Clerk.FieldError className="text-sm font-medium text-destructive" />
                </Clerk.Field>

                <Clerk.Field name="password" className="grid gap-2">
                  <Clerk.Label className="text-sm font-medium">Password</Clerk.Label>
                  <Clerk.Input 
                    type="password"
                    className={cn(
                      "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm",
                      "ring-1 ring-inset ring-input",
                      "placeholder:text-muted-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "data-[invalid]:ring-destructive"
                    )}
                    placeholder="••••••••"
                  />
                  <Clerk.FieldError className="text-sm font-medium text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    Password must be at least 8 characters long
                  </p>
                </Clerk.Field>
              </div>

              <SignUp.Action
                submit
                className={cn(
                  "inline-flex items-center justify-center rounded-md text-sm font-medium",
                  "h-10 px-4 py-2",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  "disabled:pointer-events-none disabled:opacity-50",
                  "transition-colors"
                )}
              >
                Create Account
              </SignUp.Action>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Clerk.Link
                navigate="sign-in"
                className={cn(
                  "underline underline-offset-4 hover:text-primary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                )}
              >
                Sign in
              </Clerk.Link>
            </p>
          </SignUp.Step>

          <SignUp.Step name="verifications" className="w-full space-y-6 sm:w-[350px] mx-auto">
            <SignUp.Strategy name="email_code">
              <div className="flex flex-col space-y-2 text-center mb-8">
                <h1 className="text-2xl font-semibold tracking-tight">Verify your email</h1>
                <p className="text-sm text-muted-foreground">
                  Please check your email for the verification code
                </p>
              </div>

              <div className="grid gap-6">
                <Clerk.Field name="code" className="grid gap-2">
                  <Clerk.Label className="text-sm font-medium">Verification Code</Clerk.Label>
                  <Clerk.Input 
                    type="otp"
                    className={cn(
                      "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm text-center tracking-widest",
                      "ring-1 ring-inset ring-input",
                      "placeholder:text-muted-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      "data-[invalid]:ring-destructive"
                    )}
                    placeholder="000000"
                  />
                  <Clerk.FieldError className="text-sm font-medium text-destructive" />
                </Clerk.Field>

                <SignUp.Action
                  submit
                  className={cn(
                    "inline-flex items-center justify-center rounded-md text-sm font-medium",
                    "h-10 px-4 py-2",
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    "disabled:pointer-events-none disabled:opacity-50",
                    "transition-colors"
                  )}
                >
                  Verify
                </SignUp.Action>
              </div>

                <SignUp.Action
                  resend
                  className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                >
                  Didn't receive a code? Send a new one
                </SignUp.Action>
              </SignUp.Strategy>

              {/* CAPTCHA element */}
              <div id="clerk-captcha" />
          </SignUp.Step>
        </SignUp.Root>
      </div>
    </div>
  )
}
