/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as activity from "../activity.js";
import type * as categories from "../categories.js";
import type * as courses from "../courses.js";
import type * as dashboard from "../dashboard.js";
import type * as enrollments from "../enrollments.js";
import type * as helpers from "../helpers.js";
import type * as migrateUserProgress from "../migrateUserProgress.js";
import type * as quizzes from "../quizzes.js";
import type * as streaks from "../streaks.js";
import type * as types from "../types.js";
import type * as userProgress from "../userProgress.js";
import type * as videos from "../videos.js";
import type * as youtubeTypes from "../youtubeTypes.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  categories: typeof categories;
  courses: typeof courses;
  dashboard: typeof dashboard;
  enrollments: typeof enrollments;
  helpers: typeof helpers;
  migrateUserProgress: typeof migrateUserProgress;
  quizzes: typeof quizzes;
  streaks: typeof streaks;
  types: typeof types;
  userProgress: typeof userProgress;
  videos: typeof videos;
  youtubeTypes: typeof youtubeTypes;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
