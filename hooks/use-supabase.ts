'use client';

import { useSupabase } from '@/contexts/supabase-context';
import { useUser } from '@clerk/nextjs';
import { useCallback } from 'react';

/**
 * Hook to interact with Supabase user data
 */
export function useSupabaseUser() {
  const supabase = useSupabase();
  const { user } = useUser();
  
  /**
   * Get the current user from Supabase
   */
  const getCurrentUser = useCallback(async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', user.id)
      .single();
    
    if (error) {
      console.error('Error getting user from Supabase:', error);
      return null;
    }
    
    return data;
  }, [supabase, user]);
  
  /**
   * Get the current user's profile from Supabase
   */
  const getUserProfile = useCallback(async () => {
    if (!user) return null;
    
    // First get the user to get the Supabase user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();
    
    if (!userData) return null;
    
    // Then get the user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userData.id)
      .single();
    
    if (error) {
      console.error('Error getting user profile from Supabase:', error);
      return null;
    }
    
    return data;
  }, [supabase, user]);
  
  /**
   * Get the current user's stats from Supabase
   */
  const getUserStats = useCallback(async () => {
    if (!user) return null;
    
    // First get the user to get the Supabase user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
      .single();
    
    if (!userData) return null;
    
    // Then get the user stats
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userData.id)
      .single();
    
    if (error) {
      console.error('Error getting user stats from Supabase:', error);
      return null;
    }
    
    return data;
  }, [supabase, user]);
  
  /**
   * Update the current user's profile in Supabase
   */
  const updateUserProfile = useCallback(async (profileData: any) => {
    if (!user) return null;
    
    // First get the user to get the Supabase user ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', user.id)
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
  }, [supabase, user]);
  
  return {
    getCurrentUser,
    getUserProfile,
    getUserStats,
    updateUserProfile,
  };
}
