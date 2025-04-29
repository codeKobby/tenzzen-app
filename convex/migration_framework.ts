import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Interface for a migration definition
export interface Migration {
  id: string;
  name: string;
  description: string;
  version: number;
  runAfter?: string[]; // IDs of migrations that must run before this one
  apply: (ctx: any) => Promise<any>;
}

// Keep track of migrations in the migrations_registry table
// We'll need to add this table to the schema.ts file
export const registerMigration = mutation({
  args: {
    migrationId: v.string(),
    name: v.string(),
    description: v.string(),
    version: v.number(),
    appliedAt: v.number(), // Timestamp when migration was applied
    result: v.any(), // Result of the migration
  },
  handler: async (ctx, args) => {
    const { migrationId, name, description, version, appliedAt, result } = args;
    
    // Check if already registered
    const existing = await ctx.db
      .query("migrations_registry")
      .withIndex("by_migration_id", (q) => q.eq("migrationId", migrationId))
      .unique();
      
    if (existing) {
      // Update the existing record with new result (for re-runs)
      return await ctx.db.patch(existing._id, {
        appliedAt,
        result,
        rerun: true
      });
    }
    
    // Register new migration
    return await ctx.db.insert("migrations_registry", {
      migrationId,
      name,
      description,
      version,
      appliedAt,
      result,
      rerun: false,
    });
  },
});

// Get all registered migrations
export const getAppliedMigrations = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("migrations_registry")
      .withIndex("by_version")
      .collect();
  },
});

// Get a specific migration by ID
export const getMigrationById = query({
  args: { migrationId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("migrations_registry")
      .withIndex("by_migration_id", (q) => q.eq("migrationId", args.migrationId))
      .unique();
  },
});

// Check if a migration has been applied
export const isMigrationApplied = query({
  args: { migrationId: v.string() },
  handler: async (ctx, args) => {
    const migration = await ctx.db
      .query("migrations_registry")
      .withIndex("by_migration_id", (q) => q.eq("migrationId", args.migrationId))
      .unique();
      
    return !!migration;
  },
});

// Apply a migration
export const applyMigration = mutation({
  args: {
    migrationId: v.string(),
    name: v.string(),
    description: v.string(),
    version: v.number(),
  },
  handler: async (ctx, args) => {
    const { migrationId, name, description, version } = args;
    
    // Check if already applied
    const existing = await ctx.db
      .query("migrations_registry")
      .withIndex("by_migration_id", (q) => q.eq("migrationId", migrationId))
      .unique();
      
    if (existing) {
      return {
        success: false,
        message: `Migration ${migrationId} has already been applied at ${new Date(existing.appliedAt).toISOString()}`,
        alreadyApplied: true,
      };
    }
    
    // Record start of migration
    console.log(`Starting migration: ${migrationId} (${name}) - ${description}`);
    const startTime = Date.now();
    
    try {
      // This is just a registration - the actual migration code will be run separately
      // Each migration is defined as its own mutation in the migrations.ts file
      
      // Record successful completion
      const result = {
        success: true,
        message: `Migration ${migrationId} (${name}) applied successfully`,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
      };
      
      // Register the migration
      await ctx.db.insert("migrations_registry", {
        migrationId,
        name,
        description,
        version,
        appliedAt: Date.now(),
        result,
        rerun: false,
      });
      
      return result;
    } catch (error: unknown) {
      // Record failure
      const errorMessage = error instanceof Error ? error.message : String(error);
      const result = {
        success: false,
        message: `Migration ${migrationId} (${name}) failed: ${errorMessage}`,
        error: errorMessage,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
      };
      
      console.error(`Migration failed: ${migrationId}`, error);
      
      return result;
    }
  },
});

// Get the current schema version (highest applied migration version)
export const getCurrentSchemaVersion = query({
  handler: async (ctx) => {
    const migrations = await ctx.db
      .query("migrations_registry")
      .withIndex("by_version")
      .order("desc")
      .take(1);
      
    if (migrations.length === 0) {
      return 0; // No migrations applied yet
    }
    
    return migrations[0].version;
  },
});

// Utility to check if all required migrations have been applied
export const checkRequiredMigrations = query({
  args: { requiredMigrationIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const { requiredMigrationIds } = args;
    
    // Fetch all the applied migrations
    const appliedMigrations = await ctx.db
      .query("migrations_registry")
      .collect();
      
    // Filter the applied migrations to find those in the required list
    const appliedIds = appliedMigrations.map(m => m.migrationId);
    const missingMigrations = requiredMigrationIds.filter(
      id => !appliedIds.includes(id)
    );
    
    return {
      allApplied: missingMigrations.length === 0,
      missingMigrations,
    };
  },
});