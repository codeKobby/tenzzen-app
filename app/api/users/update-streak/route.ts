import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * API endpoint to update a user's streak
 * POST /api/users/update-streak
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const authData = await auth();
    const userId = authData.userId;

    if (!userId) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Create a Supabase client
    const supabase = await createServerSupabaseClient();

    // First get the user to get the Supabase user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error getting user from Supabase:', userError);
      return NextResponse.json({
        error: 'User not found',
        details: userError
      }, { status: 404 });
    }

    // Check if user_stats entry exists
    const { data: existingStats, error: checkError } = await supabase
      .from('user_stats')
      .select('id')
      .eq('user_id', userData.id)
      .single();

    // If no stats entry exists, create one with initial streak of 1
    if (checkError || !existingStats) {
      console.log('No user_stats entry found, creating initial entry with streak 1');
      const { error: createError } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userData.id,
          streak_days: 1,
          longest_streak: 1,
          weekly_activity: [0, 0, 0, 0, 0, 0, 0]
        });

      if (createError) {
        console.error('Error creating initial user stats:', createError);
        return NextResponse.json({
          error: 'Failed to create initial user stats',
          details: createError
        }, { status: 500 });
      }

      // Return the initial streak data
      return NextResponse.json({
        success: true,
        streak: 1,
        longest_streak: 1,
        details: 'Initial streak created'
      });
    }

    // Call the update_user_streak function
    const { data: streakData, error: streakError } = await supabase
      .rpc('update_user_streak', {
        p_user_id: userData.id
      });

    if (streakError) {
      console.error('Error updating user streak:', streakError);
      return NextResponse.json({
        error: 'Failed to update streak',
        details: streakError
      }, { status: 500 });
    }

    // Get the updated user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('streak_days, longest_streak')
      .eq('user_id', userData.id)
      .single();

    if (statsError) {
      console.error('Error getting updated user stats:', statsError);
      return NextResponse.json({
        error: 'Failed to get updated stats',
        details: statsError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      streak: userStats.streak_days,
      longest_streak: userStats.longest_streak,
      details: streakData
    });
  } catch (error) {
    console.error('Unexpected error updating streak:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      details: String(error)
    }, { status: 500 });
  }
}
