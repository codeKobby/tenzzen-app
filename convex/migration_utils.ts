import { action } from "./_generated/server";
import { v } from "convex/values";
import { migrations } from "./migrations";
import { api } from "./_generated/api";
import { Migration } from "./migration_framework";

interface MigrationResult {
  migrationId: string;
  name?: string;
  version?: number;
  success: boolean;
  message?: string;
  skipped?: boolean;
  result?: any;
  error?: string;
}

interface MigrationCheckResult {
  allApplied: boolean;
  missingMigrations: string[];
}

interface AppliedMigration {
  migrationId: string;
  name: string;
  description: string;
  version: number;
  appliedAt: number;
  result: any;
  rerun: boolean;
}

// Utility to run all pending migrations in order
export const runPendingMigrations = action({
  args: {},
  handler: async (ctx): Promise<{
    success: boolean;
    message: string;
    migrationsRun: number;
    results?: MigrationResult[];
  }> => {
    console.log("Starting migration process...");
    
    // Get all applied migrations
    const appliedMigrations: AppliedMigration[] = await ctx.runQuery(api.migration_framework.getAppliedMigrations, {});
    
    // Create a map of applied migration IDs for quick lookup
    const appliedMigrationIds: Set<string> = new Set(appliedMigrations.map((m: AppliedMigration) => m.migrationId));
    
    // Filter migrations that haven't been applied yet
    const pendingMigrations: Migration[] = migrations.filter((m: Migration) => !appliedMigrationIds.has(m.id))
      .sort((a: Migration, b: Migration) => a.version - b.version);
    
    if (pendingMigrations.length === 0) {
      console.log("No pending migrations to apply.");
      return {
        success: true,
        message: "No pending migrations to apply.",
        migrationsRun: 0
      };
    }
    
    console.log(`Found ${pendingMigrations.length} pending migrations to apply.`);
    
    // Track results of all migrations
    const results: MigrationResult[] = [];
    
    // Run migrations in order of version number
    for (const migration of pendingMigrations) {
      console.log(`Running migration: ${migration.id} (v${migration.version}) - ${migration.name}`);
      
      // Check if dependencies are satisfied
      if (migration.runAfter && migration.runAfter.length > 0) {
        const dependenciesCheck: MigrationCheckResult = await ctx.runQuery(api.migration_framework.checkRequiredMigrations, {
          requiredMigrationIds: migration.runAfter
        });
        
        if (!dependenciesCheck.allApplied) {
          console.log(`Skipping migration ${migration.id} - dependencies not satisfied: ${dependenciesCheck.missingMigrations.join(', ')}`);
          results.push({
            migrationId: migration.id,
            success: false,
            message: `Dependencies not satisfied: ${dependenciesCheck.missingMigrations.join(', ')}`,
            skipped: true
          });
          continue;
        }
      }
      
      try {
        // Register the migration
        await ctx.runMutation(api.migration_framework.applyMigration, {
          migrationId: migration.id,
          name: migration.name,
          description: migration.description,
          version: migration.version
        });
        
        // Apply the migration logic
        const result = await migration.apply(ctx);
        
        // Record the result
        await ctx.runMutation(api.migration_framework.registerMigration, {
          migrationId: migration.id,
          name: migration.name,
          description: migration.description,
          version: migration.version,
          appliedAt: Date.now(),
          result
        });
        
        results.push({
          migrationId: migration.id,
          name: migration.name,
          version: migration.version,
          success: true,
          result
        });
        
        console.log(`Successfully applied migration: ${migration.id}`);
      } catch (error: unknown) {
        console.error(`Error applying migration ${migration.id}:`, error);
        
        results.push({
          migrationId: migration.id,
          name: migration.name,
          version: migration.version,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // Stop on first error
        break;
      }
    }
    
    const successCount: number = results.filter((r: MigrationResult) => r.success).length;
    const failureCount: number = results.filter((r: MigrationResult) => !r.success).length;
    
    return {
      success: failureCount === 0,
      message: `Applied ${successCount} migrations, ${failureCount} failures.`,
      migrationsRun: successCount,
      results
    };
  }
});

// Run a specific migration by ID
export const runSpecificMigration = action({
  args: { migrationId: v.string() },
  handler: async (ctx, args): Promise<{
    success: boolean;
    message: string;
    result?: any;
    error?: string;
  }> => {
    const { migrationId } = args;
    
    // Find the migration by ID
    const migration: Migration | undefined = migrations.find((m: Migration) => m.id === migrationId);
    
    if (!migration) {
      return {
        success: false,
        message: `Migration ${migrationId} not found.`
      };
    }
    
    console.log(`Running specific migration: ${migration.id} (v${migration.version}) - ${migration.name}`);
    
    try {
      // Register the migration
      await ctx.runMutation(api.migration_framework.applyMigration, {
        migrationId: migration.id,
        name: migration.name,
        description: migration.description,
        version: migration.version
      });
      
      // Apply the migration logic
      const result = await migration.apply(ctx);
      
      // Record the result
      await ctx.runMutation(api.migration_framework.registerMigration, {
        migrationId: migration.id,
        name: migration.name,
        description: migration.description,
        version: migration.version,
        appliedAt: Date.now(),
        result
      });
      
      console.log(`Successfully applied migration: ${migration.id}`);
      
      return {
        success: true,
        message: `Successfully applied migration: ${migration.id}`,
        result
      };
    } catch (error: unknown) {
      console.error(`Error applying migration ${migration.id}:`, error);
      
      return {
        success: false,
        message: `Error applying migration ${migration.id}: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
});