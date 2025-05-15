import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { auth } from '@clerk/nextjs/server';

/**
 * API endpoint to unenroll a user from a course
 * POST /api/supabase/courses/unenroll
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
    const { courseId } = body;

    // Validate input
    if (!courseId) {
      return NextResponse.json({
        error: 'Missing required course ID'
      }, { status: 400 });
    }

    // Create a Supabase client
    const supabase = await createServerSupabaseClient();

    // Get the Supabase user ID from the Clerk ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        error: 'User not found in Supabase',
        details: userError
      }, { status: 404 });
    }

    const supabaseUserId = userData.id;

    // Check if the enrollment exists
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, course_id')
      .eq('user_id', supabaseUserId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError) {
      return NextResponse.json({
        error: 'Failed to check enrollment',
        details: enrollmentError
      }, { status: 500 });
    }

    if (!enrollment) {
      return NextResponse.json({
        error: 'Enrollment not found'
      }, { status: 404 });
    }

    // Delete the enrollment
    const { error: deleteError } = await supabase
      .from('enrollments')
      .delete()
      .eq('id', enrollment.id);

    if (deleteError) {
      return NextResponse.json({
        error: 'Failed to delete enrollment',
        details: deleteError
      }, { status: 500 });
    }

    // Update the course enrollment count
    await supabase.rpc('decrement_course_enrollment_count', { course_id: courseId });

    // Update user stats
    const { data: userStats, error: statsError } = await supabase
      .from('user_stats')
      .select('id, courses_in_progress')
      .eq('user_id', supabaseUserId)
      .single();

    if (!statsError && userStats && userStats.courses_in_progress > 0) {
      await supabase
        .from('user_stats')
        .update({
          courses_in_progress: userStats.courses_in_progress - 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userStats.id);
    }

    return NextResponse.json({
      success: true,
      message: 'User unenrolled from course successfully'
    });
  } catch (error) {
    console.error('Error unenrolling user from course:', error);
    return NextResponse.json({
      error: 'Failed to unenroll user from course',
      details: error
    }, { status: 500 });
  }
}
