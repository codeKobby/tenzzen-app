"use client";

import { useState, useCallback } from "react";
import {
  Note,
  CreateNoteInput,
  UpdateNoteInput,
  CategoryFilter,
  SortOption,
} from "@/types/notes";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";

interface UseNotesOptions {
  initialFilter?: CategoryFilter;
  initialSort?: SortOption;
  initialSearch?: string;
  courseId?: string;
  lessonId?: string;
  autoRefresh?: boolean; // Deprecated with Convex (realtime)
}

export function useNotes({
  initialFilter = "all",
  initialSort = "recent",
  initialSearch = "",
  courseId,
  lessonId,
}: UseNotesOptions = {}) {
  const { user } = useUser();
  const [filter, setFilter] = useState<CategoryFilter>(initialFilter);
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [search, setSearch] = useState(initialSearch);

  // Convex Query
  const notesQuery = useQuery(api.notes.list, {
    clerkId: user?.id || "",
    filter,
    search: search || undefined,
    courseId,
    lessonId,
  });

  //convex mutations
  const createMutation = useMutation(api.notes.create);
  const updateMutation = useMutation(api.notes.update);
  const removeMutation = useMutation(api.notes.remove);
  const toggleStarMutation = useMutation(api.notes.toggleStar);

  // Client-side sorting (since Convex basic sort covers creation time/updated time, but specific fields might be easier here)
  const notes: Note[] = (notesQuery || [])
    .map((n) => ({
      id: n._id,
      userId: n.clerkId,
      courseId: n.courseId,
      lessonId: n.lessonId,
      title: n.title,
      content: n.content,
      category: n.category as any, // Cast to match stricter frontend type if needed
      tags: n.tags || [],
      starred: n.isStarred,
      createdAt: new Date(n.createdAt).toISOString(),
      updatedAt: new Date(n.updatedAt).toISOString(),
      // Optional
      preview: n.content.replace(/<[^>]*>?/gm, "").slice(0, 150) + "...",
    }))
    .sort((a, b) => {
      if (sort === "recent") {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      } else if (sort === "oldest") {
        return (
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        );
      } else if (sort === "alphabetical") {
        return a.title.localeCompare(b.title);
      } else if (sort === "category") {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });

  const loading = notesQuery === undefined;

  // Function to create a new note
  const createNote = useCallback(
    async (input: CreateNoteInput): Promise<Note | null> => {
      if (!user?.id) return null;

      try {
        const noteId = await createMutation({
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
          courseId: input.courseId,
          lessonId: input.lessonId,
          clerkId: user.id,
        });
        toast.success("Note created successfully");

        // Construct a temporary return object (real object comes via subscription)
        return {
          id: noteId,
          userId: user.id,
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags || [],
          starred: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Note;
      } catch (err) {
        console.error("Error creating note:", err);
        toast.error("Failed to create note");
        return null;
      }
    },
    [createMutation, user?.id],
  );

  // Function to update a note
  const updateNote = useCallback(
    async (input: UpdateNoteInput): Promise<Note | null> => {
      try {
        await updateMutation({
          id: input.id as Id<"notes">,
          title: input.title,
          content: input.content,
          category: input.category,
          tags: input.tags,
          isStarred: input.starred,
        });
        toast.success("Note updated successfully");
        return null; // Subscription handles update
      } catch (err) {
        console.error("Error updating note:", err);
        toast.error("Failed to update note");
        return null;
      }
    },
    [updateMutation],
  );

  // Function to delete a note
  const deleteNote = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await removeMutation({ id: id as Id<"notes"> });
        toast.success("Note deleted successfully");
        return true;
      } catch (err) {
        console.error("Error deleting note:", err);
        toast.error("Failed to delete note");
        return false;
      }
    },
    [removeMutation],
  );

  // Function to toggle star status
  const toggleStar = useCallback(
    async (id: string, starred: boolean): Promise<boolean> => {
      try {
        // Optimistic update handled by Convex if we passed an optimistic handler, but fast enough for now
        await toggleStarMutation({ id: id as Id<"notes"> });
        toast.success(starred ? "Note starred" : "Note unstarred");
        return true;
      } catch (err) {
        console.error("Error toggling star:", err);
        toast.error("Failed to update note");
        return false;
      }
    },
    [toggleStarMutation],
  );

  // Fetch note is now just filtering the list or could be a separate useQuery
  const fetchNote = useCallback(async (id: string): Promise<Note | null> => {
    // In a real app we might useQuery(api.notes.get, {id}) in the component
    // For now we can return null since we are using subscriptions
    return null;
  }, []);

  const fetchNotes = useCallback(async () => {
    // No-op for realtime
  }, []);

  return {
    notes,
    loading,
    error: null,
    filter,
    setFilter,
    sort,
    setSort,
    search,
    setSearch,
    fetchNotes,
    fetchNote,
    createNote,
    updateNote,
    deleteNote,
    toggleStar,
  };
}
