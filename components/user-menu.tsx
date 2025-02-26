"use client"

import { UserButton } from "@clerk/nextjs"
import { cn } from "@/lib/utils"

export function UserMenu({ className }: { className?: string }) {
  return (
    <UserButton
      afterSignOutUrl="/"
      appearance={{
        elements: {
          avatarBox: cn(
            "h-8 w-8", // Match button height
            "rounded-full ring-1 ring-input",
            className
          )
        }
      }}
    />
  )
}
