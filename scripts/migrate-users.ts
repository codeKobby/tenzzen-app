import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { createClient } from '@supabase/supabase-js';

// Initialize Convex client
const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Initialize Supabase client
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Migrates users from Convex to Supabase
 */
export async function migrateUsers() {
  try {
    // Get all users from Convex
    const users = await convexClient.query(api.users.getAllUsers);
    console.log(`Found ${users.length} users in Convex`);

    for (const user of users) {
      // Check if user already exists in Supabase
      const { data: existingUser } = await supabaseClient
        .from('users')
        .select('id')
        .eq('clerk_id', user.clerkId)
        .single();

      if (existingUser) {
        console.log(`User ${user.email} already exists in Supabase, updating...`);
        
        // Update existing user
        const { error } = await supabaseClient
          .from('users')
          .update({
            email: user.email,
            name: user.name,
            image_url: user.imageUrl,
            role: user.role,
            status: user.status,
            updated_at: new Date().toISOString(),
          })
          .eq('clerk_id', user.clerkId);

        if (error) {
          console.error(`Error updating user ${user.email}:`, error);
          continue;
        }
      } else {
        console.log(`Creating new user ${user.email} in Supabase...`);
        
        // Create new user
        const { data: newUser, error } = await supabaseClient
          .from('users')
          .insert({
            clerk_id: user.clerkId,
            email: user.email,
            name: user.name,
            image_url: user.imageUrl,
            role: user.role || 'user',
            status: user.status || 'active',
            created_at: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
            updated_at: user.updatedAt ? new Date(user.updatedAt).toISOString() : new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error(`Error creating user ${user.email}:`, error);
          continue;
        }

        // Get user profile from Convex
        const userProfile = await convexClient.query(api.users.getUserProfile, { userId: user.clerkId });
        
        if (userProfile) {
          console.log(`Migrating profile for user ${user.email}...`);
          
          // Create user profile in Supabase
          const { error: profileError } = await supabaseClient
            .from('user_profiles')
            .insert({
              user_id: newUser.id,
              bio: userProfile.bio,
              timezone: userProfile.timezone,
              language: userProfile.language,
              preferences: userProfile.preferences,
              learning_preferences: userProfile.learningPreferences,
              updated_at: userProfile.updatedAt ? new Date(userProfile.updatedAt).toISOString() : new Date().toISOString(),
            });

          if (profileError) {
            console.error(`Error creating profile for user ${user.email}:`, profileError);
          }
        }

        // Get user stats from Convex
        const userStats = await convexClient.query(api.user_stats.getUserStats, { userId: user.clerkId });
        
        if (userStats) {
          console.log(`Migrating stats for user ${user.email}...`);
          
          // Create user stats in Supabase
          const { error: statsError } = await supabaseClient
            .from('user_stats')
            .insert({
              user_id: newUser.id,
              total_learning_hours: userStats.totalLearningHours || 0,
              courses_completed: userStats.coursesCompleted || 0,
              courses_in_progress: userStats.coursesInProgress || 0,
              assessments_completed: userStats.assessmentsCompleted || 0,
              projects_submitted: userStats.projectsSubmitted || 0,
              last_active_at: userStats.lastActiveAt ? new Date(userStats.lastActiveAt).toISOString() : new Date().toISOString(),
              streak_days: userStats.streakDays || 0,
              longest_streak: userStats.longestStreak || 0,
              total_points: userStats.totalPoints || 0,
              weekly_activity: userStats.weeklyActivity || [0, 0, 0, 0, 0, 0, 0],
            });

          if (statsError) {
            console.error(`Error creating stats for user ${user.email}:`, statsError);
          }
        }
      }
    }

    console.log('User migration completed successfully');
    return { success: true, count: users.length };
  } catch (error) {
    console.error('Error migrating users:', error);
    return { success: false, error };
  }
}
