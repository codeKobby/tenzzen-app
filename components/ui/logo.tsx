import { cn } from "@/lib/utils"

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsed?: boolean
}

export function Logo({ collapsed, className, ...props }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <div className="rounded-lg bg-primary p-1.5 flex items-center justify-center">
        <span className="text-[10px] font-bold text-primary-foreground tracking-widest">TZ</span>
      </div>
      {!collapsed && (
        <span className="font-semibold text-lg tracking-tight">
          Tenzzen
        </span>
      )}
    </div>
  )
}
