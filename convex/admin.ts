import { query } from "./_generated/server";
import { migrations } from "./migrations";
import { v } from "convex/values";

/**
 * Get a list of all available migrations
 * For use in the admin interface
 */
export const getAvailableMigrations = query({
  args: {},
  handler: async (ctx) => {
    // Return the migrations array from migrations.ts
    return migrations.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      version: m.version,
      runAfter: m.runAfter || []
    }));
  },
});