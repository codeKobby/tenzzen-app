"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { saveGeneratedCourseToPublic as serverSaveGeneratedCourseToPublic } from "@/actions/saveGeneratedCourseToPublic";

// Keep export names matching previous Supabase hook names so components don't need changes
export function useSupabaseVideoQuery(youtubeId: string) {
  const id = youtubeId || "";
  const data = useQuery(api.videos.getCachedVideo, { youtubeId: id });
  return { data };
}

export function useUpdateSupabaseVideoCourseData() {
  const mutation = useMutation(api.videos.saveCourseData as any);

  async function updateVideoCourseData({ youtubeId, courseData }: { youtubeId: string; courseData: any }) {
    if (!youtubeId) throw new Error("youtubeId required");
    return await mutation({ youtubeId, courseData });
  }

  return { updateVideoCourseData };
}

export function useSaveSupabaseCourseToPublic() {
  async function saveGeneratedCourseToPublic({ courseData, userId }: { courseData: any; userId?: string }) {
    // Call server action that uses Convex createAICourse mutation
    return await serverSaveGeneratedCourseToPublic(courseData, { userId });
  }

  return { saveGeneratedCourseToPublic };
}
