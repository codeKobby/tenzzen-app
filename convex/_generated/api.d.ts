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
import type * as admin from "../admin.js";
import type * as assessments from "../assessments.js";
import type * as categories from "../categories.js";
import type * as courses from "../courses.js";
import type * as crons from "../crons.js";
import type * as helpers from "../helpers.js";
import type * as index from "../index.js";
import type * as init from "../init.js";
import type * as library from "../library.js";
import type * as migration_framework from "../migration_framework.js";
import type * as migration_utils from "../migration_utils.js";
import type * as migrations_fix_user_stats_field_names from "../migrations/fix_user_stats_field_names.js";
import type * as migrations_fix_user_timestamps from "../migrations/fix_user_timestamps.js";
import type * as migrations from "../migrations.js";
import type * as progress from "../progress.js";
import type * as tasks from "../tasks.js";
import type * as transcripts from "../transcripts.js";
import type * as types from "../types.js";
import type * as user_stats from "../user_stats.js";
import type * as users from "../users.js";
import type * as validation from "../validation.js";
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
  admin: typeof admin;
  assessments: typeof assessments;
  categories: typeof categories;
  courses: typeof courses;
  crons: typeof crons;
  helpers: typeof helpers;
  index: typeof index;
  init: typeof init;
  library: typeof library;
  migration_framework: typeof migration_framework;
  migration_utils: typeof migration_utils;
  "migrations/fix_user_stats_field_names": typeof migrations_fix_user_stats_field_names;
  "migrations/fix_user_timestamps": typeof migrations_fix_user_timestamps;
  migrations: typeof migrations;
  progress: typeof progress;
  tasks: typeof tasks;
  transcripts: typeof transcripts;
  types: typeof types;
  user_stats: typeof user_stats;
  users: typeof users;
  validation: typeof validation;
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
