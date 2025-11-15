import { Loader2 } from "lucide-react"

export default function CoursesLoading() {
    return (
        <div className="flex h-[calc(100vh-64px)] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading your courses...</p>
            </div>
        </div>
    )
}
