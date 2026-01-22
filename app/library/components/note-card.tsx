"use client"

import { NoteInterface } from "../page"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Star,
  Edit3,
  Trash2,
  Share2,
  BookOpen,
  Code,
  FileText,
  ExternalLink,
  Clock,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useRouter } from "@/hooks/use-router-with-loader"
import { motion } from "framer-motion"

interface NoteCardProps {
  note: NoteInterface
  view: "grid" | "list"
  onToggleStar: () => void
  onEdit: () => void
  onDelete: () => void
  onShare: () => void
}

const getCategoryIcon = (category: NoteInterface["category"]) => {
  switch (category) {
    case "course":
      return <BookOpen className="h-4 w-4" />
    case "code":
      return <Code className="h-4 w-4" />
    default:
      return <FileText className="h-4 w-4" />
  }
}

export function NoteCard({
  note,
  view,
  onToggleStar,
  onEdit,
  onDelete,
  onShare
}: NoteCardProps) {
  const router = useRouter()

  // Function to strip HTML tags for preview
  const createTextPreview = (html: string): string => {
    if (typeof document === 'undefined') return ''
    const tempElement = document.createElement('div')
    tempElement.innerHTML = html
    const textContent = tempElement.textContent || tempElement.innerText || ''
    return textContent.substring(0, 180) + (textContent.length > 180 ? '...' : '')
  }

  const previewText = note.preview || createTextPreview(note.content)

  const cardClasses = view === "grid" 
    ? "compact-card hover:bg-muted/5 group relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
    : "list-item group relative transition-all duration-200"

  return (
    <motion.div
      layout
      className={cardClasses}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: view === "grid" ? 1.02 : 1.01 }}
    >
      <div className={cn("flex justify-between gap-3", view === "list" ? "items-center w-full" : "flex-col h-full")}>
        
        {/* Header Section */}
        <div className={cn("flex justify-between items-start gap-2", view === "list" && "w-1/3 shrink-0")}>
          <div 
            className="flex items-start gap-3 min-w-0 cursor-pointer"
            onClick={() => router.push(`/library/${note.id}`)}
          >
            <div className={cn(
              "rounded-lg p-2.5 transition-colors",
              note.category === 'code' ? "bg-blue-500/10 text-blue-500" :
              note.category === 'course' ? "bg-violet-500/10 text-violet-500" :
              "bg-primary/10 text-primary"
            )}>
              {getCategoryIcon(note.category)}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground/90 leading-tight truncate group-hover:text-primary transition-colors">
                {note.title}
              </h3>
              {note.course && (
                <p className="mt-1 text-xs text-muted-foreground truncate flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {note.course}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content Preview (Grid only mostly, or truncated in list) */}
        {!view || view === "grid" ? (
           <div 
             className="flex-1 mt-2 cursor-pointer"
             onClick={() => router.push(`/library/${note.id}`)}
           >
             <p className="text-sm text-muted-foreground/80 line-clamp-3 leading-relaxed">
               {previewText}
             </p>
           </div>
        ) : (
          <div className="flex-1 px-4 cursor-pointer min-w-0" onClick={() => router.push(`/library/${note.id}`)}>
             <p className="text-sm text-muted-foreground/80 line-clamp-1">
               {previewText}
             </p>
          </div>
        )}

        {/* Footer / Actions */}
        <div className={cn("flex items-center mt-auto pt-3 gap-2", view === "list" ? "mt-0 pt-0 shrink-0" : "w-full justify-between")}>
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-[24px]">
            {note.tags?.slice(0, 3).map((tag: string) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                #{tag}
              </span>
            ))}
          </div>

          {/* Date & Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <span className={cn("text-[10px] text-muted-foreground flex items-center gap-1", view === "list" && "hidden sm:flex")}>
              <Clock className="h-3 w-3" />
              {new Date(note.updatedAt).toLocaleDateString()}
            </span>
            
            <div className="flex items-center gap-1 ml-2">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-7 w-7", note.starred ? "text-amber-400" : "text-muted-foreground opacity-0 group-hover:opacity-100")}
                onClick={(e) => { e.stopPropagation(); onToggleStar() }}
              >
                <Star className="h-3.5 w-3.5" fill={note.starred ? "currentColor" : "none"} />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all"
                onClick={(e) => { e.stopPropagation(); onEdit() }}
              >
                <Edit3 className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                onClick={(e) => { e.stopPropagation(); onDelete() }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  )
}

export function NoteCardSkeleton({ view }: { view: "grid" | "list" }) {
  return (
    <div className={cn(
      "rounded-lg border bg-card/50 backdrop-blur-sm",
      view === "list" ? "p-3 flex items-center gap-4" : "p-4 space-y-3"
    )}>
      <div className="flex items-start gap-3 w-full">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      {view === "grid" && (
        <div className="space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
      )}
      <div className={cn("flex gap-2", view === "list" ? "ml-auto" : "mt-2")}>
        <Skeleton className="h-6 w-6 rounded-md" />
        <Skeleton className="h-6 w-6 rounded-md" />
      </div>
    </div>
  )
}
