import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  label: string
  value: string
  icon: LucideIcon
  change?: {
    value: string
    positive: boolean
  }
}

export function StatsCard({ label, value, icon: Icon, change }: StatsCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 transition-all hover:border-primary/50">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={cn(
            "text-sm font-medium",
            change.positive ? "text-green-500" : "text-red-500"
          )}>
            {change.positive ? "+" : "-"}{change.value}
          </div>
        )}
      </div>
    </div>
  )
}