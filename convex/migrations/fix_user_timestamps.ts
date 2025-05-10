import { mutation } from "../_generated/server";

/**
 * Migration to fix user records with missing createdAt and updatedAt fields
 * This migration adds createdAt and updatedAt fields to user records that don't have them
 */
export const fixUserTimestamps = mutation({
  args: {},
  handler: async (ctx) => {
    // Find all user records
    const users = await ctx.db.query("users").collect();
    let fixed = 0;
    let errors = 0;
    const now = Date.now();
    
    for (const user of users) {
      try {
        const updates: Record<string, any> = {};
        let needsUpdate = false;
        
        // Check for missing createdAt field
        if (!('createdAt' in user)) {
          updates.createdAt = now;
          needsUpdate = true;
        }
        
        // Check for missing updatedAt field
        if (!('updatedAt' in user)) {
          updates.updatedAt = now;
          needsUpdate = true;
        }
        
        // If any fields need to be updated, patch the record
        if (needsUpdate) {
          await ctx.db.patch(user._id, updates);
          fixed++;
        }
      } catch (error) {
        console.error(`Error fixing user record ${user._id}:`, error);
        errors++;
      }
    }
    
    return {
      success: true,
      message: `Fixed ${fixed} user records, encountered ${errors} errors`,
      fixed,
      errors
    };
  }
});
