"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { saveGeneratedCourseToPublic as serverSaveGeneratedCourseToPublic } from "@/actions/saveGeneratedCourseToPublic";

export function useVideoQuery(youtubeId: string) {
  const id = youtubeId || "";
  const data = useQuery(api.videos.getCachedVideo, { youtubeId: id });
  return { data };
}

export function useUpdateVideoCourseData() {
  const mutation = useMutation(api.videos.saveCourseData as any);

  async function updateVideoCourseData({
    youtubeId,
    courseData,
  }: {
    youtubeId: string;
    courseData: any;
  }) {
    if (!youtubeId) throw new Error("youtubeId required");
    return await mutation({ youtubeId, courseData });
  }

  return { updateVideoCourseData };
}

export function useSaveCourseToPublic() {
  async function saveGeneratedCourseToPublic({
    courseData,
    userId,
  }: {
    courseData: any;
    userId?: string;
  }) {
    return await serverSaveGeneratedCourseToPublic(courseData, { userId });
  }

  return { saveGeneratedCourseToPublic };
}
