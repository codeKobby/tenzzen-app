"use client"

import * as React from "react"
import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-white">
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
                "flex h-10 w-full rounded-md bg-white dark:bg-white px-3 py-2 text-sm ring-1 ring-inset ring-input placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
              footerActionLink: "font-medium text-zinc-900 dark:text-zinc-900 hover:text-zinc-800 dark:hover:text-zinc-800",
              dividerLine: "bg-zinc-200 dark:bg-zinc-200",
              dividerText: "text-zinc-500 dark:text-zinc-500",
              socialButtonsBlockButton__google__loading:
                "flex items-center justify-center w-full gap-x-2 rounded-lg bg-white dark:bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-50 transition-colors ring-1 ring-inset ring-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:shadow-lg",
            },
          }}
          routing="path"
          path="/sign-up"
        />
      </div>
    </div>
  )
}
