import { mutation } from "../_generated/server";

/**
 * Migration to fix user_stats records with snake_case field names
 * This migration converts snake_case field names to camelCase field names
 */
export const fixUserStatsFieldNames = mutation({
  args: {},
  handler: async (ctx) => {
    // Find all user_stats records
    const userStats = await ctx.db.query("user_stats").collect();
    let fixed = 0;
    let errors = 0;
    
    for (const stat of userStats) {
      try {
        const updates: Record<string, any> = {};
        let needsUpdate = false;
        
        // Check for snake_case field names and convert them to camelCase
        if ('assessments_completed' in stat) {
          updates.assessmentsCompleted = stat.assessments_completed;
          needsUpdate = true;
        }
        
        if ('courses_completed' in stat) {
          updates.coursesCompleted = stat.courses_completed;
          needsUpdate = true;
        }
        
        if ('courses_in_progress' in stat) {
          updates.coursesInProgress = stat.courses_in_progress;
          needsUpdate = true;
        }
        
        if ('projects_submitted' in stat) {
          updates.projectsSubmitted = stat.projects_submitted;
          needsUpdate = true;
        }
        
        if ('total_learning_hours' in stat) {
          updates.totalLearningHours = stat.total_learning_hours;
          needsUpdate = true;
        }
        
        if ('last_active_at' in stat) {
          updates.lastActiveAt = stat.last_active_at;
          needsUpdate = true;
        }
        
        if ('streak_days' in stat) {
          updates.streakDays = stat.streak_days;
          needsUpdate = true;
        }
        
        if ('longest_streak' in stat) {
          updates.longestStreak = stat.longest_streak;
          needsUpdate = true;
        }
        
        if ('total_points' in stat) {
          updates.totalPoints = stat.total_points;
          needsUpdate = true;
        }
        
        if ('weekly_activity' in stat) {
          updates.weeklyActivity = stat.weekly_activity;
          needsUpdate = true;
        }
        
        // If any fields need to be updated, patch the record
        if (needsUpdate) {
          await ctx.db.patch(stat._id, updates);
          fixed++;
        }
      } catch (error) {
        console.error(`Error fixing user_stats record ${stat._id}:`, error);
        errors++;
      }
    }
    
    return {
      success: true,
      message: `Fixed ${fixed} user_stats records, encountered ${errors} errors`,
      fixed,
      errors
    };
  }
});
