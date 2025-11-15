import { createServerSupabaseClient } from './supabase-server';
import type { AuthObject, User } from '@clerk/nextjs/server';

/**
 * Synchronizes the current Clerk user to Supabase
 * @param authData - The auth object from Clerk middleware
 */
export async function syncCurrentUserToSupabase(authData?: AuthObject) {
  if (!authData) {
    console.error('No auth data provided to syncCurrentUserToSupabase');
    return null;
  }

  const userId = authData.userId;
  if (!userId || !authData.user) return null;

  try {
    // Use the user object directly from auth()
    return syncUserToSupabase(authData.user);
  } catch (error) {
    console.error('Failed to sync user to Supabase:', error);
    return null;
  }
}

/**
 * Synchronizes a Clerk user to Supabase
 */
export async function syncUserToSupabase(clerkUser: any) {
  const supabase = await createServerSupabaseClient();

  try {
    console.log('Syncing user to Supabase:', clerkUser.id);

    // Check if user exists in Supabase
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkUser.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking if user exists in Supabase:', checkError);
    }

    const userData = {
      email: clerkUser.emailAddresses[0]?.emailAddress,
      name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      image_url: clerkUser.imageUrl,
      updated_at: new Date().toISOString(),
    };

    if (existingUser) {
      console.log('Updating existing user in Supabase:', clerkUser.id);
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('clerk_id', clerkUser.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user in Supabase:', error);
        return null;
      }

      // Update user streak
      try {
        const { data: streakData, error: streakError } = await supabase
          .rpc('update_user_streak', {
            p_user_id: existingUser.id
          });

        if (streakError) {
          console.error('Error updating user streak:', streakError);
        } else {
          console.log('Successfully updated user streak:', streakData);
        }
      } catch (streakUpdateError) {
        console.error('Unexpected error updating streak:', streakUpdateError);
      }

      return data;
    } else {
      console.log('Creating new user in Supabase:', clerkUser.id);
      // Create new user with all required fields
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          clerk_id: clerkUser.id,
          ...userData,
          auth_provider: 'clerk',
          role: 'user',
          status: 'active',
          created_at: new Date().toISOString(),
          last_login: {
            time: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user in Supabase:', error);
        return null;
      }

      console.log('Successfully created user in Supabase:', newUser?.id);

      // Initialize user profile and stats
      if (newUser) {
        try {
          await supabase.from('user_profiles').insert({
            user_id: newUser.id,
          });

          await supabase.from('user_stats').insert({
            user_id: newUser.id,
            streak_days: 1, // Initialize streak to 1 for new users
            longest_streak: 1, // Initialize longest streak to 1 as well
            last_active_at: new Date().toISOString()
          });

          console.log('Successfully initialized user profile and stats');
        } catch (profileError) {
          console.error('Error initializing user profile or stats:', profileError);
        }
      }

      return newUser;
    }
  } catch (error) {
    console.error('Unexpected error in syncUserToSupabase:', error);
    return null;
  }
}
