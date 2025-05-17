import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { auth } from '@clerk/nextjs/server';
import { validateCourseId } from '@/lib/utils';

/**
 * API endpoint to enroll a user in a course
 * POST /api/supabase/courses/enroll
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

    // Validate input using the utility function
    const validation = validateCourseId(courseId);
    if (!validation.isValid) {
      return NextResponse.json({
        error: validation.error || 'Invalid course ID'
      }, { status: 400 });
    }

    // Create a Supabase client
    const supabase = await createServerSupabaseClient();

    // Get the Supabase user ID from the Clerk ID
    const supabaseUserId = await getUserIdFromClerkId(supabase, userId);

    if (!supabaseUserId) {
      return NextResponse.json({
        error: 'User not found in Supabase'
      }, { status: 404 });
    }

    // Check if the course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({
        error: 'Course not found',
        details: courseError
      }, { status: 404 });
    }

    // Check if the user is already enrolled
    const { data: existingEnrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', supabaseUserId)
      .eq('course_id', courseId)
      .limit(1);

    if (enrollmentError) {
      return NextResponse.json({
        error: 'Failed to check enrollment status',
        details: enrollmentError
      }, { status: 500 });
    }

    // If already enrolled, return success
    if (existingEnrollment && existingEnrollment.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'User already enrolled in course',
        enrollmentId: existingEnrollment[0].id,
        newEnrollment: false
      });
    }

    // Create a new enrollment
    const { data: newEnrollment, error: insertError } = await supabase
      .from('enrollments')
      .insert({
        user_id: supabaseUserId,
        course_id: courseId,
        enrolled_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        completion_status: 'not_started',
        progress: 0,
        is_active: true
      })
      .select('id')
      .single();

    if (insertError) {
      return NextResponse.json({
        error: 'Failed to create enrollment',
        details: insertError
      }, { status: 500 });
    }

    // Update the course enrollment count
    await supabase.rpc('increment_course_enrollment_count', { course_id: courseId });

    return NextResponse.json({
      success: true,
      message: 'User enrolled in course successfully',
      enrollmentId: newEnrollment.id,
      newEnrollment: true
    });
  } catch (error) {
    console.error('Error enrolling user in course:', error);
    return NextResponse.json({
      error: 'Failed to enroll user in course',
      details: error
    }, { status: 500 });
  }
}

/**
 * Helper function to get the Supabase user ID from a Clerk ID
 */
async function getUserIdFromClerkId(supabase: any, clerkId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerkId)
    .single();

  if (error || !data) {
    console.error('Error getting user ID from Clerk ID:', error);
    return null;
  }

  return data.id;
}
