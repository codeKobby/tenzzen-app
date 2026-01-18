"use client"

import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Coins } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

export function CreditsDisplay() {
    const { userId } = useAuth()
    const user = useQuery(api.users.getUser, userId ? { clerkId: userId } : "skip")
    const isLoading = user === undefined

    if (!userId) return null

    if (isLoading) {
        return <Skeleton className="h-7 w-16 rounded-full" />
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center">
                        <Badge variant="secondary" className="gap-1.5 px-2.5 h-8 cursor-help transition-colors hover:bg-secondary/80">
                            <Coins className="h-3.5 w-3.5 text-amber-500 fill-amber-500/20" />
                            <span className="font-medium">{user?.credits ?? 0}</span>
                        </Badge>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                    <div className="text-sm">
                        <p className="font-semibold">{user?.credits ?? 0} Credits Available</p>
                        <p className="text-xs text-muted-foreground mt-1">Used to generate AI courses and assessments</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
