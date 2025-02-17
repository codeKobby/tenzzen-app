import { Card, CardHeader } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface QuickActionCardProps {
  title: string
  desc: string
  icon: LucideIcon
  onClick?: () => void
}

export function QuickActionCard({ title, desc, icon: Icon, onClick }: QuickActionCardProps) {
  return (
    <Card 
      className="transition-all hover:border-primary/50 hover:bg-accent/50 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}