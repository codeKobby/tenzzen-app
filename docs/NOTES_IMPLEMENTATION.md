# Notes Implementation with shadcn

## Overview

The notes page provides a comprehensive note-taking and management interface using shadcn components.

## Key Components Used

- Card
- Button
- Input
- ScrollArea
- Tabs
- DropdownMenu
- Dialog
- Separator
- Icons

## Implementation

```tsx
// app/(dashboard)/notes/page.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  File,
  Folder,
  Plus,
  Search,
  MoreVertical,
  Star,
  Clock,
  Edit3,
  Trash2,
  FileText,
  Share2
} from "lucide-react"
import { NoteCard } from "./components/note-card"
import { NewNoteDialog } from "./components/new-note-dialog"

interface Note {
  id: string
  title: string
  content: string
  category: string
  starred: boolean
  lastModified: string
  course?: string
}

export default function NotesPage() {
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [showNewNote, setShowNewNote] = useState(false)

  return (
    <div className="container py-8">
      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        {/* Sidebar */}
        <div className="space-y-4">
          <Button className="w-full" onClick={() => setShowNewNote(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Note
          </Button>

          <Separator />

          {/* Categories */}
          <div className="space-y-1">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={filter === category.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setFilter(category.id)}
              >
                {category.icon}
                <span className="ml-2">{category.name}</span>
                <span className="ml-auto text-muted-foreground">
                  {category.count}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-[400px]"
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.map((note) => (
                  <NoteCard key={note.id} note={note} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <NewNoteDialog
        open={showNewNote}
        onOpenChange={setShowNewNote}
      />
    </div>
  )
}

// app/(dashboard)/notes/components/note-card.tsx
interface NoteCardProps {
  note: Note
}

export function NoteCard({ note }: NoteCardProps) {
  return (
    <Card className="group relative">
      <CardHeader className="space-y-0 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <File className="h-4 w-4 mt-1 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">{note.title}</h3>
              {note.course && (
                <p className="text-sm text-muted-foreground">
                  From: {note.course}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit3 className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            {formatDate(note.lastModified)}
          </div>
          {note.starred && (
            <Star className="h-4 w-4 text-primary" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// app/(dashboard)/notes/components/new-note-dialog.tsx
export function NewNoteDialog({
  open,
  onOpenChange
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<NewNoteData>()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="min-h-[200px]"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create Note</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
```

## Features

1. **Notes Management**
   - Note creation
   - Category organization
   - Search functionality
   - Quick actions

2. **Visual Components**
   - Note cards
   - Category sidebar
   - Search input
   - Action buttons

3. **Interactive Elements**
   - Dropdown menus
   - New note dialog
   - Category filtering
   - Hover states

4. **Responsive Design**
   - Grid layout
   - Sidebar collapse
   - Mobile optimization
   - Consistent spacing

## Usage Example

```tsx
// In app layout
import { NotesPage } from "@/components/notes"

export default function DashboardLayout() {
  return (
    <div>
      <Sidebar />
      <main>
        <NotesPage />
      </main>
    </div>
  )
}
```

This implementation provides a comprehensive note-taking interface using shadcn components while maintaining a clean and organized user experience.