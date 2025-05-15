import { createServerSupabaseClient } from './supabase-server';
import { currentUser } from '@clerk/nextjs/server';
import type { AuthObject } from '@clerk/nextjs/server';

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
  if (!userId) return null;

  try {
    // Get the user directly from currentUser()
    const clerkUser = await currentUser();
    if (clerkUser) {
      return syncUserToSupabase(clerkUser);
    }
  } catch (error) {
    console.error('Failed to get user from currentUser():', error);
  }

  // If we couldn't get the user, return null
  return null;
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
