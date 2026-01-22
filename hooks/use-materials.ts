"use client";

import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { useCallback } from "react";

export interface UserMaterial {
  _id: Id<"user_materials">;
  userId: string;
  title: string;
  fileType: "pdf" | "doc" | "txt" | "url";
  fileUrl?: string;
  sourceUrl?: string;
  extractedText?: string;
  topics?: string[];
  summary?: string;
  audioOverviewUrl?: string;
  audioScript?: string;
  linkedCourseId?: Id<"courses">;
  recommendedVideos?: {
    youtubeId: string;
    title: string;
    thumbnail?: string;
    relevanceScore: number;
  }[];
  lastStudiedAt?: string;
  studyCount: number;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UseMaterialsOptions {
  category?: string;
  limit?: number;
}

export interface UseMaterialsReturn {
  materials: UserMaterial[];
  recentMaterials: UserMaterial[];
  loading: boolean;
  createMaterial: (params: {
    title: string;
    fileType: "pdf" | "doc" | "txt" | "url";
    fileUrl?: string;
    sourceUrl?: string;
    extractedText?: string;
    topics?: string[];
    summary?: string;
    category?: string;
    tags?: string[];
  }) => Promise<Id<"user_materials"> | null>;
  updateMaterial: (
    id: Id<"user_materials">,
    updates: {
      title?: string;
      topics?: string[];
      summary?: string;
      category?: string;
      tags?: string[];
    },
  ) => Promise<void>;
  recordStudy: (id: Id<"user_materials">) => Promise<void>;
  deleteMaterial: (id: Id<"user_materials">) => Promise<void>;
  generateAudioOverview: (id: Id<"user_materials">) => Promise<void>;
}

export function useMaterials(
  options: UseMaterialsOptions = {},
): UseMaterialsReturn {
  const { userId } = useAuth();
  const { category, limit } = options;

  // Fetch all materials
  const materials = useQuery(
    api.materials.list,
    userId ? { category, limit } : "skip",
  ) as UserMaterial[] | undefined;

  // Fetch recent materials for dashboard
  const recentMaterials = useQuery(
    api.materials.getRecent,
    userId ? { limit: 5 } : "skip",
  ) as UserMaterial[] | undefined;

  // Mutations
  const createMutation = useMutation(api.materials.create);
  const updateMutation = useMutation(api.materials.update);
  const recordStudyMutation = useMutation(api.materials.recordStudy);
  const deleteMutation = useMutation(api.materials.deleteMaterial); // Fixed: remove -> deleteMaterial
  const generateAudioAction = useAction(api.materials.generateAudioOverview);

  // Create a new material
  const createMaterial = useCallback(
    async (params: {
      title: string;
      fileType: "pdf" | "doc" | "txt" | "url";
      fileUrl?: string;
      sourceUrl?: string;
      extractedText?: string;
      topics?: string[];
      summary?: string;
      category?: string;
      tags?: string[];
    }) => {
      if (!userId) return null;
      const result = await createMutation(params);
      return result;
    },
    [userId, createMutation],
  );

  // Update a material
  const updateMaterial = useCallback(
    async (
      id: Id<"user_materials">,
      updates: {
        title?: string;
        topics?: string[];
        summary?: string;
        category?: string;
        tags?: string[];
      },
    ) => {
      await updateMutation({ id, ...updates });
    },
    [updateMutation],
  );

  // Record study activity
  const recordStudy = useCallback(
    async (id: Id<"user_materials">) => {
      await recordStudyMutation({ id });
    },
    [recordStudyMutation],
  );

  // Delete a material
  const deleteMaterial = useCallback(
    async (id: Id<"user_materials">) => {
      await deleteMutation({ id });
    },
    [deleteMutation],
  );

  // Generate audio overview
  const generateAudioOverview = useCallback(
    async (id: Id<"user_materials">) => {
      await generateAudioAction({ materialId: id });
    },
    [generateAudioAction],
  );

  return {
    materials: materials || [],
    recentMaterials: recentMaterials || [],
    loading: materials === undefined,
    createMaterial,
    updateMaterial,
    recordStudy,
    deleteMaterial,
    generateAudioOverview,
  };
}
