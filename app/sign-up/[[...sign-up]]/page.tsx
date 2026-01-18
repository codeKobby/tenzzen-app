"use client"

import * as React from "react"
import { SignUp } from "@clerk/nextjs"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="absolute top-6 left-6">
        <Button variant="ghost" size="sm" asChild className="gap-2 text-muted-foreground hover:text-foreground">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
      <div className="w-full max-w-sm px-3">
        {/* Sign Up Form */}
        <SignUp
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-card/95 backdrop-blur-sm shadow-xl border border-border rounded-xl",
              headerTitle: "text-foreground font-bold",
              headerSubtitle: "text-muted-foreground",
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90 font-medium",
              form: "space-y-4",
              formFieldLabel: "text-foreground font-medium",
              formFieldInput:
                "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm text-foreground ring-1 ring-inset ring-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
              formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
              footerActionLink: "font-medium text-primary hover:text-primary/80",
              footerActionText: "text-muted-foreground",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              socialButtonsBlockButton:
                "flex items-center justify-center w-full gap-x-2 rounded-lg bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors ring-1 ring-inset ring-input",
              socialButtonsBlockButtonText: "text-foreground",
              identityPreviewText: "text-foreground",
              identityPreviewEditButton: "text-primary hover:text-primary/80",
              formResendCodeLink: "text-primary hover:text-primary/80",
              otpCodeFieldInput: "text-foreground bg-background border-input",
              alternativeMethodsBlockButton: "text-foreground hover:bg-muted",
            },
          }}
          routing="path"
          path="/sign-up"
          fallbackRedirectUrl="/dashboard"
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  )
}
