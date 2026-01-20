"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { Bell, AlertTriangle, CheckCircle, XCircle, Info, Flame, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export function NotificationsPopover() {
    const { user } = useUser()
    const [open, setOpen] = useState(false)

    const notifications = useQuery(api.notifications.get, user?.id ? { userId: user.id } : "skip")
    const unreadCount = useQuery(api.notifications.unreadCount, user?.id ? { userId: user.id } : "skip")

    const markAsRead = useMutation(api.notifications.markAsRead)
    const markAllAsRead = useMutation(api.notifications.markAllAsRead)

    if (!user) return null

    const handleMarkAsRead = async (e: React.MouseEvent, id: any) => {
        e.stopPropagation();
        await markAsRead({ notificationId: id })
    }

    const handleMarkAllRead = async () => {
        if (user?.id) await markAllAsRead({ userId: user.id })
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount !== undefined && unreadCount > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse ring-2 ring-background" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="font-semibold text-sm">Notifications</h4>
                    {unreadCount !== undefined && unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-auto px-2 py-1 text-xs">
                            Mark all read
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications === undefined ? (
                        <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                            Loading...
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                            <Bell className="h-8 w-8 opacity-20" />
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y relative">
                            {notifications.map((n) => (
                                <div
                                    key={n._id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group cursor-pointer",
                                        !n.read && "bg-muted/30"
                                    )}
                                    onClick={() => !n.read && markAsRead({ notificationId: n._id })}
                                >
                                    <div className="flex gap-3 items-start">
                                        <div className="mt-1 shrink-0">
                                            {getIcon(n.type)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className={cn("text-sm font-medium leading-none", !n.read && "text-foreground font-semibold")}>
                                                {n.title || n.message}
                                            </p>
                                            {n.title && <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>}
                                            <p className="text-[10px] text-muted-foreground pt-1">
                                                {new Date(n.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {!n.read && (
                                            <div className="shrink-0 self-center">
                                                <span className="flex h-2 w-2 rounded-full bg-primary" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    )
}

function getIcon(type: string) {
    switch (type) {
        case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
        case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
        case 'error': return <XCircle className="h-4 w-4 text-red-500" />
        case 'streak': return <Flame className="h-4 w-4 text-orange-500" />
        case 'achievement': return <Trophy className="h-4 w-4 text-yellow-500" />
        default: return <Info className="h-4 w-4 text-blue-500" />
    }
}
