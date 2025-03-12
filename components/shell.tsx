import * as React from "react"
import { cn } from "@/lib/utils"

interface ShellProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: "default" | "none";
  scroll?: boolean;
}

export function Shell({
  children,
  padding = "default",
  scroll = true,
  className,
  ...props
}: ShellProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col",
        padding === "default" && "container py-6",
        !scroll && "overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}