import { createServerSupabaseClient } from '@/lib/supabase-server';
import { auth } from '@clerk/nextjs/server';

/**
 * Get the current user from Supabase
 */
export async function getCurrentUser() {
  const { userId } = auth();
  if (!userId) return null;
  
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .single();
  
  if (error || !data) {
    console.error('Error getting user from Supabase:', error);
    return null;
  }
  
  return data;
}

/**
 * Get a user by Clerk ID from Supabase
 */
export async function getUserByClerkId(clerkId: string) {
  const supabase = await createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_id', clerkId)
    .single();
  
  if (error || !data) {
    console.error('Error getting user from Supabase:', error);
    return null;
  }
  
  return data;
}

/**
 * Get user profile from Supabase
 */
export async function getUserProfile(userId?: string) {
  const authData = auth();
  const clerkId = userId || authData.userId;
  if (!clerkId) return null;
  
  const supabase = await createServerSupabaseClient();
  
  // First get the user to get the Supabase user ID
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();
  
  if (!userData) return null;
  
  // Then get the user profile
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userData.id)
    .single();
  
  if (error || !data) {
    console.error('Error getting user profile from Supabase:', error);
    return null;
  }
  
  return data;
}

/**
 * Get user stats from Supabase
 */
export async function getUserStats(userId?: string) {
  const authData = auth();
  const clerkId = userId || authData.userId;
  if (!clerkId) return null;
  
  const supabase = await createServerSupabaseClient();
  
  // First get the user to get the Supabase user ID
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();
  
  if (!userData) return null;
  
  // Then get the user stats
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userData.id)
    .single();
  
  if (error || !data) {
    console.error('Error getting user stats from Supabase:', error);
    return null;
  }
  
  return data;
}

/**
 * Update user profile in Supabase
 */
export async function updateUserProfile(profileData: any) {
  const { userId } = auth();
  if (!userId) return null;
  
  const supabase = await createServerSupabaseClient();
  
  // First get the user to get the Supabase user ID
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .single();
  
  if (!userData) return null;
  
  // Then update the user profile
  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      ...profileData,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userData.id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating user profile in Supabase:', error);
    return null;
  }
  
  return data;
}
