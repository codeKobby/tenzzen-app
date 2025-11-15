import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * API endpoint to get user activity data
 * GET /api/user/activity
 */
export async function GET(req: NextRequest) {
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
    const supabase = createServerSupabaseClient();

    // Get the Supabase user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        error: 'User not found in database'
      }, { status: 404 });
    }

    const supabaseUserId = userData.id;

    // Get current user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('id, daily_activity, last_active_at')
      .eq('user_id', supabaseUserId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      return NextResponse.json({
        error: 'Failed to get user stats',
        details: statsError
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      activity: userStats?.daily_activity || null,
      lastActiveAt: userStats?.last_active_at || null
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * API endpoint to update user activity data
 * POST /api/user/activity
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

    // Parse the request body
    const body = await req.json();
    const { minutes, date } = body;

    // Validate input
    if (typeof minutes !== 'number' || !date) {
      return NextResponse.json({
        error: 'Invalid input data'
      }, { status: 400 });
    }

    // Create a Supabase client
    const supabase = createServerSupabaseClient();

    // Get the Supabase user ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        error: 'User not found in database'
      }, { status: 404 });
    }

    const supabaseUserId = userData.id;

    // Get current user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('id, daily_activity')
      .eq('user_id', supabaseUserId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      return NextResponse.json({
        error: 'Failed to get user stats',
        details: statsError
      }, { status: 500 });
    }

    // Update user stats
    if (userStats) {
      // Update existing user stats
      const { error: updateError } = await supabase
        .from('user_stats')
        .update({
          daily_activity: { date, minutes },
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userStats.id);

      if (updateError) {
        return NextResponse.json({
          error: 'Failed to update user stats',
          details: updateError
        }, { status: 500 });
      }
    } else {
      // Create new user stats
      const { error: insertError } = await supabase
        .from('user_stats')
        .insert({
          user_id: supabaseUserId,
          daily_activity: { date, minutes },
          last_active_at: new Date().toISOString()
        });

      if (insertError) {
        return NextResponse.json({
          error: 'Failed to create user stats',
          details: insertError
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      minutes,
      date
    });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
