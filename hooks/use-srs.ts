"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";
import { useMemo, useCallback } from "react";

// SM-2 Algorithm Constants
const MIN_EASE_FACTOR = 1.3;
const DEFAULT_EASE_FACTOR = 2.5;

export interface SRSItem {
  _id: Id<"srs_items">;
  userId: string;
  courseId: Id<"courses">;
  lessonId?: Id<"lessons">;
  quizQuestionId?: Id<"quizQuestions">;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  front: string;
  back: string;
  cardType: "quiz" | "key_point" | "user_created";
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SM-2 Algorithm Implementation
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect, but remembered upon seeing answer
 * 2 - Incorrect, but easy to recall
 * 3 - Correct with serious difficulty
 * 4 - Correct with some hesitation
 * 5 - Perfect response
 */
export function calculateNextReview(
  quality: ReviewQuality,
  currentInterval: number,
  currentRepetitions: number,
  currentEaseFactor: number,
): { interval: number; repetitions: number; easeFactor: number } {
  let newInterval: number;
  let newRepetitions: number;
  let newEaseFactor: number;

  // Calculate new ease factor
  newEaseFactor =
    currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure ease factor doesn't drop below minimum
  if (newEaseFactor < MIN_EASE_FACTOR) {
    newEaseFactor = MIN_EASE_FACTOR;
  }

  // If quality is less than 3, reset repetitions
  if (quality < 3) {
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = currentRepetitions + 1;

    // Calculate new interval based on repetitions
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(currentInterval * newEaseFactor);
    }
  }

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: newEaseFactor,
  };
}

/**
 * Calculate the next review date based on interval
 */
export function getNextReviewDate(intervalDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + intervalDays);
  return date.toISOString().split("T")[0]; // YYYY-MM-DD format
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  return new Date().toISOString().split("T")[0];
}

export interface UseSRSOptions {
  courseId?: Id<"courses">;
}

export interface UseSRSReturn {
  dueItems: SRSItem[];
  allItems: SRSItem[];
  dueCount: number;
  loading: boolean;
  reviewItem: (
    itemId: Id<"srs_items">,
    quality: ReviewQuality,
  ) => Promise<void>;
  createItem: (params: {
    courseId: Id<"courses">;
    lessonId?: Id<"lessons">;
    front: string;
    back: string;
    cardType: "quiz" | "key_point" | "user_created";
  }) => Promise<Id<"srs_items"> | null>;
  deleteItem: (itemId: Id<"srs_items">) => Promise<void>;
}

export function useSRS(options: UseSRSOptions = {}): UseSRSReturn {
  const { userId } = useAuth();
  const { courseId } = options;

  // Fetch all SRS items for the user
  const allItems = useQuery(
    api.srs.listItems,
    userId ? { courseId } : "skip",
  ) as SRSItem[] | undefined;

  // Mutations
  const createItemMutation = useMutation(api.srs.createItem);
  const updateItemMutation = useMutation(api.srs.updateItem);
  const deleteItemMutation = useMutation(api.srs.deleteItem);

  // Filter items that are due for review
  const dueItems = useMemo(() => {
    if (!allItems) return [];
    const today = getTodayDate();
    return allItems.filter((item) => item.nextReviewDate <= today);
  }, [allItems]);

  // Review an item and update its SRS data
  const reviewItem = useCallback(
    async (itemId: Id<"srs_items">, quality: ReviewQuality) => {
      const item = allItems?.find((i) => i._id === itemId);
      if (!item) return;

      const { interval, repetitions, easeFactor } = calculateNextReview(
        quality,
        item.interval,
        item.repetitions,
        item.easeFactor,
      );

      const nextReviewDate = getNextReviewDate(interval);

      await updateItemMutation({
        id: itemId,
        easeFactor,
        interval,
        repetitions,
        nextReviewDate,
        lastReviewedAt: new Date().toISOString(),
      });
    },
    [allItems, updateItemMutation],
  );

  // Create a new SRS item
  const createItem = useCallback(
    async (params: {
      courseId: Id<"courses">;
      lessonId?: Id<"lessons">;
      front: string;
      back: string;
      cardType: "quiz" | "key_point" | "user_created";
    }) => {
      if (!userId) return null;

      const nextReviewDate = getTodayDate(); // Due immediately
      const result = await createItemMutation({
        ...params,
        easeFactor: DEFAULT_EASE_FACTOR,
        interval: 0,
        repetitions: 0,
        nextReviewDate,
      });

      return result;
    },
    [userId, createItemMutation],
  );

  // Delete an SRS item
  const deleteItem = useCallback(
    async (itemId: Id<"srs_items">) => {
      await deleteItemMutation({ id: itemId });
    },
    [deleteItemMutation],
  );

  return {
    dueItems,
    allItems: allItems || [],
    dueCount: dueItems.length,
    loading: allItems === undefined,
    reviewItem,
    createItem,
    deleteItem,
  };
}
