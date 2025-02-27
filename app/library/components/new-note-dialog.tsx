"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { NoteInterface } from "../page"
import { useEffect } from "react"

const categories = [
  { id: "course", name: "Course Notes" },
  { id: "personal", name: "Personal Notes" },
  { id: "code", name: "Code Snippets" },
]

const newNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.enum(["course", "personal", "code"]),
  content: z.string().min(1, "Content is required"),
  course: z.string().optional(),
  tags: z.string().optional(),
})

type NewNoteFormValues = z.infer<typeof newNoteSchema>

interface NewNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateNote: (data: NewNoteFormValues) => void
  editingNote: NoteInterface | null
}

export function NewNoteDialog({
  open,
  onOpenChange,
  onCreateNote,
  editingNote
}: NewNoteDialogProps) {
  const form = useForm<NewNoteFormValues>({
    resolver: zodResolver(newNoteSchema),
    defaultValues: {
      title: "",
      category: "personal",
      content: "",
      course: "",
      tags: "",
    },
  })

  // Reset form when dialog opens with editingNote or closes
  useEffect(() => {
    if (open) {
      if (editingNote) {
        form.reset({
          title: editingNote.title,
          category: editingNote.category,
          content: editingNote.content,
          course: editingNote.course || "",
          tags: editingNote.tags?.join(", ") || "",
        });
      } else {
        form.reset({
          title: "",
          category: "personal",
          content: "",
          course: "",
          tags: "",
        });
      }
    }
  }, [open, editingNote, form]);

  const handleSubmit = (data: NewNoteFormValues) => {
    onCreateNote(data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingNote ? "Edit Note" : "Create New Note"}</DialogTitle>
          <DialogDescription>
            {editingNote
              ? "Edit your note details below."
              : "Add a new note to your library. Fill in the details below."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Note title" {...field} />
                  </FormControl>
                  <FormMessage />
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
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("category") === "course" && (
              <FormField
                control={form.control}
                name="course"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <FormControl>
                      <Input placeholder="Course name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your note content here..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter tags separated by commas"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {editingNote ? "Save Changes" : "Create Note"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
