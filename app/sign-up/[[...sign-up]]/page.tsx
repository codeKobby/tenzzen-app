"use client"

import * as React from "react"
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm px-3">
        {/* Sign Up Form */}
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary:
                "bg-primary text-primary-foreground hover:bg-primary/90",
              card: "bg-transparent shadow-none",
              form: "space-y-4",
              formField: "space-y-2",
              formFieldInput:
                "flex h-10 w-full rounded-md bg-background px-3 py-2 text-sm ring-1 ring-inset ring-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
              footerActionLink: "font-medium text-foreground hover:text-foreground/90",
              dividerLine: "bg-border",
              dividerText: "text-muted-foreground",
              socialButtonsBlockButton__google__loading:
                "flex items-center justify-center w-full gap-x-2 rounded-lg bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors ring-1 ring-inset ring-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            },
          }}
          routing="path"
          path="/sign-up"
        />
      </div>
    </div>
  )
}
