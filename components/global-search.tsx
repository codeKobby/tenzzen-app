"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2, BookOpen, FileText, StickyNote, PlayCircle } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@clerk/nextjs"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const router = useRouter()
  const { userId } = useAuth()

  // Toggle search with keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // In a real implementation, we'd debounce this or use a dedicated search hook
  // that only queries when open is true and query length > 0
  const searchResults = useQuery(api.search.globalSearch, 
    open && query.length > 0 && userId 
      ? { query, userId } 
      : "skip"
  );
  
  const isLoading = open && query.length > 0 && searchResults === undefined;

  const runCommand = React.useCallback((command: () => unknown) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative inline-flex h-9 w-full items-center justify-start rounded-md border border-input bg-muted/50 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:pr-12"
      >
        <span className="hidden lg:inline-flex">Search courses, notes...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput 
          placeholder="Type to search..." 
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              query.length > 0 ? "No results found." : "Start typing to search..."
            )}
          </CommandEmpty>
          
          {searchResults?.courses && searchResults.courses.length > 0 && (
            <CommandGroup heading="Courses">
              {searchResults.courses.map((course: any) => (
                <CommandItem
                  key={course.id}
                  value={`course-${course.title}`}
                  onSelect={() => runCommand(() => router.push(course.url))}
                >
                  <PlayCircle className="mr-2 h-4 w-4" />
                  <span>{course.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {searchResults?.notes && searchResults.notes.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Notes">
                {searchResults.notes.map((note: any) => (
                  <CommandItem
                    key={note.id}
                    value={`note-${note.title}`}
                    onSelect={() => runCommand(() => router.push(note.url))}
                  >
                    <StickyNote className="mr-2 h-4 w-4" />
                    <span>{note.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {searchResults?.materials && searchResults.materials.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Materials">
                {searchResults.materials.map((material: any) => (
                  <CommandItem
                    key={material.id}
                    value={`material-${material.title}`}
                    onSelect={() => runCommand(() => router.push(material.url))}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    <span>{material.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
