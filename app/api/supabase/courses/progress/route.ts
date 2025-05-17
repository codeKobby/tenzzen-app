import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { auth } from '@clerk/nextjs/server';
import { validateCourseId } from '@/lib/utils';

/**
 * API endpoint to update a user's course progress
 * POST /api/supabase/courses/progress
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
    const { courseId, lessonId, sectionIndex, lessonIndex, completed } = body;

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

    // Get the current enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, completed_lessons, progress, course_id')
      .eq('user_id', supabaseUserId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError) {
      return NextResponse.json({
        error: 'Failed to get enrollment',
        details: enrollmentError
      }, { status: 500 });
    }

    if (!enrollment) {
      return NextResponse.json({
        error: 'Enrollment not found'
      }, { status: 404 });
    }

    // Format the lesson identifier
    const lessonIdentifier = `${sectionIndex}-${lessonIndex}`;

    // Update completed lessons array
    let completedLessons = enrollment.completed_lessons || [];

    if (completed && !completedLessons.includes(lessonIdentifier)) {
      // Add the lesson to completed lessons
      completedLessons.push(lessonIdentifier);
    } else if (!completed && completedLessons.includes(lessonIdentifier)) {
      // Remove the lesson from completed lessons
      completedLessons = completedLessons.filter(id => id !== lessonIdentifier);
    }

    // Get the total number of lessons for this course
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('course_items')
      .eq('id', courseId)
      .single();

    if (courseError) {
      return NextResponse.json({
        error: 'Failed to get course data',
        details: courseError
      }, { status: 500 });
    }

    // Calculate total lessons from course_items
    let totalLessons = 0;
    if (courseData.course_items) {
      try {
        const courseItems = courseData.course_items;
        for (const section of courseItems) {
          if (section.lessons && Array.isArray(section.lessons)) {
            totalLessons += section.lessons.length;
          }
        }
      } catch (e) {
        console.error('Error parsing course items:', e);
      }
    }

    // Calculate progress percentage
    const progress = totalLessons > 0
      ? Math.round((completedLessons.length / totalLessons) * 100)
      : 0;

    // Determine completion status
    let completionStatus = enrollment.completion_status || 'not_started';
    if (progress === 100) {
      completionStatus = 'completed';
    } else if (progress > 0) {
      completionStatus = 'in_progress';
    }

    // Update the enrollment
    const { data: updatedEnrollment, error: updateError } = await supabase
      .from('enrollments')
      .update({
        completed_lessons: completedLessons,
        progress,
        completion_status: completionStatus,
        last_accessed_at: new Date().toISOString(),
        last_lesson_id: lessonId || lessonIdentifier
      })
      .eq('id', enrollment.id)
      .select('id, progress, completed_lessons, completion_status')
      .single();

    if (updateError) {
      return NextResponse.json({
        error: 'Failed to update progress',
        details: updateError
      }, { status: 500 });
    }

    // Update user stats if course is completed
    if (completionStatus === 'completed') {
      // Get current user stats
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('id, courses_completed')
        .eq('user_id', supabaseUserId)
        .single();

      if (!statsError && userStats) {
        // Update courses completed count
        await supabase
          .from('user_stats')
          .update({
            courses_completed: (userStats.courses_completed || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', userStats.id);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Progress updated successfully',
      progress: updatedEnrollment.progress,
      completedLessons: updatedEnrollment.completed_lessons,
      completionStatus: updatedEnrollment.completion_status
    });
  } catch (error) {
    console.error('Error updating course progress:', error);
    return NextResponse.json({
      error: 'Failed to update progress',
      details: error
    }, { status: 500 });
  }
}

/**
 * API endpoint to get a user's course progress
 * GET /api/supabase/courses/progress?courseId=xxx
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

    // Get courseId from query params
    const url = new URL(req.url);
    const courseId = url.searchParams.get('courseId');

    if (!courseId) {
      return NextResponse.json({
        error: 'Missing required course ID'
      }, { status: 400 });
    }

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

    // Get the enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id, completed_lessons, progress, completion_status, last_lesson_id, last_accessed_at')
      .eq('user_id', supabaseUserId)
      .eq('course_id', courseId)
      .single();

    if (enrollmentError && enrollmentError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      return NextResponse.json({
        error: 'Failed to get enrollment',
        details: enrollmentError
      }, { status: 500 });
    }

    if (!enrollment) {
      return NextResponse.json({
        error: 'Enrollment not found',
        progress: 0,
        completedLessons: [],
        completionStatus: 'not_started',
        lastLessonId: null,
        lastAccessedAt: null
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      progress: enrollment.progress,
      completedLessons: enrollment.completed_lessons || [],
      completionStatus: enrollment.completion_status,
      lastLessonId: enrollment.last_lesson_id,
      lastAccessedAt: enrollment.last_accessed_at
    });
  } catch (error) {
    console.error('Error getting course progress:', error);
    return NextResponse.json({
      error: 'Failed to get progress',
      details: error
    }, { status: 500 });
  }
}
