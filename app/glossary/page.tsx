"use client"

import { useState, useMemo } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, BookA, Loader2, Trash2, SlidersHorizontal, UploadCloud } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CategoryPills } from "@/components/category-pills"

export default function GlossaryPage() {
  const { userId } = useAuth()
  const [search, setSearch] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // Sort and Filter state
  const [sortBy, setSortBy] = useState<"term" | "date">("term")
  const [activeCategory, setActiveCategory] = useState("all")

  // Create form state
  const [newTerm, setNewTerm] = useState("")
  const [newDefinition, setNewDefinition] = useState("")
  const [newTags, setNewTags] = useState("") // Future use

  // Fetch all terms
  const terms = useQuery(api.glossary.list, 
    userId ? { userId, search: search || undefined } : "skip"
  )

  const createTerm = useMutation(api.glossary.create)
  const removeTerm = useMutation(api.glossary.remove)

  // Derived state for filtered and sorted terms
  const processedTerms = useMemo(() => {
    if (!terms) return []

    let result = [...terms]

    // Filter by Category/Pill
    if (activeCategory !== 'all') {
      result = result.filter(term => {
        // Handle legacy Source filtering or new Tag filtering
        if (['lesson', 'material', 'manual'].includes(activeCategory)) {
          return term.sourceType === activeCategory
        }
        // Filter by user tag
        return term.tags && term.tags.includes(activeCategory)
      })
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "term") {
        return a.term.localeCompare(b.term)
      } else {
        // Date desc
        return b._creationTime - a._creationTime
      }
    })

    return result
  }, [terms, activeCategory, sortBy])

  // Dynamic categories from User Tags
  const categoryPills = useMemo(() => {
    if (!terms) return []
    
    // Collect all unique tags and count them
    const tagCounts: Record<string, number> = {}
    terms.forEach(term => {
      if (term.tags && term.tags.length > 0) {
        term.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })

    // Create pills for tags
    const tagPills = Object.entries(tagCounts).map(([tag, count]) => ({
      name: tag,
      slug: tag,
      courseCount: count
    }))

    // Sort by count desc
    tagPills.sort((a, b) => b.courseCount - a.courseCount)

    return tagPills
  }, [terms])

  const handleCreate = async () => {
    if (!userId || !newTerm || !newDefinition) return
    
    try {
      // Parse tags from comma-separated string
      const tagsList = newTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
      
      await createTerm({
        userId,
        term: newTerm,
        definition: newDefinition,
        tags: tagsList,
        sourceType: "manual"
      })
      toast.success("Term added to glossary")
      setNewTerm("")
      setNewDefinition("")
      setNewTags("")
      setIsCreateOpen(false)
    } catch (error) {
      toast.error("Failed to add term")
    }
  }

  const handleDelete = async (id: any) => {
    try {
      await removeTerm({ id })
      toast.success("Term removed")
    } catch (error) {
      toast.error("Failed to remove term")
    }
  }

  return (
    <div className="min-h-screen relative bg-background/50">
      {/* Background Patterns for consistency */}
      <div className="pattern-dots opacity-40 fixed inset-0 z-0 pointer-events-none" />
      <div className="background-gradient fixed inset-0 z-0 pointer-events-none" />

      <div className="relative z-10 h-full">
        {/* Sticky Header */}
        <div className="sticky top-16 z-10 bg-background border-b">
          <div className="mx-auto px-4 max-w-6xl">
            {/* Controls Bar */}
            <div className="h-14 flex items-center justify-between gap-4">
              {/* Left Side: Filters */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="h-10 rounded-full px-4 gap-2 flex-shrink-0">
                      <SlidersHorizontal className="h-4 w-4" />
                      <span className="hidden xs:inline">Sort & Filter</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Sort Terms</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy("term")} className={cn(sortBy === "term" && "bg-muted")}>
                      Alphabetical (A-Z)
                      {sortBy === "term" && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("date")} className={cn(sortBy === "date" && "bg-muted")}>
                      Date Added (Newest)
                      {sortBy === "date" && <span className="ml-auto">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Center: Search Bar */}
              <div className="flex-1 flex justify-center max-w-[620px] mx-auto min-w-0">
                <div className="flex w-full items-center">
                  <div className="relative flex-1 flex items-center">
                    <div className="absolute left-4 text-muted-foreground pointer-events-none">
                      <Search className="h-4 w-4" />
                    </div>
                    <Input
                      placeholder="Search glossary..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-10 pl-11 pr-4 rounded-l-full bg-background border-border focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
                    />
                  </div>
                  <Button
                    variant="secondary"
                    className="h-10 px-5 rounded-r-full border-l-0 border border-border bg-muted hover:bg-secondary/80 flex-shrink-0"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Right Side: Primary Actions */}
              <div className="flex items-center gap-2">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-10 rounded-full px-4 gap-2 font-medium">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Add Term</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Term</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="term">Term</Label>
                        <Input
                          id="term"
                          placeholder="e.g. Closure"
                          value={newTerm}
                          onChange={(e) => setNewTerm(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="definition">Definition</Label>
                        <Textarea
                          id="definition"
                          placeholder="Explain the term..."
                          value={newDefinition}
                          onChange={(e) => setNewDefinition(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="tags">Tags</Label>
                        <Input
                          id="tags"
                          placeholder="e.g. Science, AI, Law (comma separated)"
                          value={newTags}
                          onChange={(e) => setNewTags(e.target.value)}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreate}>Save Term</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Category Pills */}
            <div className="pb-3">
              <CategoryPills
                customCategories={categoryPills}
                showRecommended={false}
                onCategoryChange={(slug) => setActiveCategory(slug)}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto w-[95%] lg:w-[90%] pt-6 pb-12">
          {terms === undefined ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : processedTerms.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
              <BookA className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No terms found</h3>
              <p className="text-muted-foreground">
                {search ? "Try adjusting your search query" : "Start building your glossary by adding terms"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {processedTerms.map((item: any) => (
                <Card key={item._id} className="relative group overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-bold text-primary">
                        {item.term}
                      </CardTitle>

                      <div className="flex gap-1 flex-wrap justify-end max-w-[50%]">
                        {item.tags && item.tags.length > 0 ? (
                          item.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] uppercase">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          // Fallback only if no tags
                          item.sourceType !== 'manual' && (
                            <Badge variant="outline" className="text-[10px] uppercase text-muted-foreground">
                              {item.sourceType}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {item.definition}
                    </p>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(item._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
