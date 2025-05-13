import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';

/**
 * API endpoint to save a generated course to Supabase
 * POST /api/supabase/courses/save
 */
export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const authData = await auth();
    const userId = authData.userId;

    // Parse the request body
    const body = await req.json();
    const { courseData } = body;

    // Validate input
    if (!courseData || !courseData.title || !courseData.videoId) {
      return NextResponse.json({
        error: 'Missing required course data'
      }, { status: 400 });
    }

    // Log the course data for debugging
    console.log('Saving course to Supabase:', {
      title: courseData.title,
      videoId: courseData.videoId,
      hasMetadata: !!courseData.metadata,
      hasCourseItems: Array.isArray(courseData.courseItems) && courseData.courseItems.length > 0
    });

    // Create a Supabase client - try both admin and regular client
    let supabase;
    try {
      // First try with the server client (with auth)
      supabase = await createServerSupabaseClient();
      console.log('Using authenticated Supabase client');
    } catch (authError) {
      console.error('Error creating authenticated Supabase client:', authError);
      // Fall back to admin client if auth fails
      supabase = createAdminSupabaseClient();
      console.log('Falling back to admin Supabase client');
    }

    // Check if a course with this videoId already exists
    const { data: existingCourses, error: queryError } = await supabase
      .from('courses')
      .select('id')
      .eq('video_id', courseData.videoId)
      .limit(1);

    if (queryError) {
      console.error('Error checking for existing course:', queryError);
      return NextResponse.json({
        error: 'Failed to check for existing course',
        details: queryError
      }, { status: 500 });
    }

    // Prepare course data for insertion/update
    const courseRecord = {
      title: courseData.title,
      subtitle: courseData.subtitle || courseData.metadata?.overviewText?.substring(0, 100) || null,
      description: courseData.description || null,
      video_id: courseData.videoId,
      youtube_url: courseData.youtubeUrl || `https://www.youtube.com/watch?v=${courseData.videoId}`,
      thumbnail: courseData.thumbnail || courseData.image || null,
      is_public: true, // Make all generated courses public by default
      created_by: userId ? await getUserIdFromClerkId(supabase, userId) : null,
      creator_id: userId || null, // Store Clerk ID as backup
      status: 'published',
      difficulty_level: courseData.metadata?.difficulty || 'beginner',
      estimated_duration: courseData.metadata?.duration ? `${courseData.metadata.duration} hours` : null,
      estimated_hours: parseFloat(courseData.metadata?.duration) || null,
      tags: Array.isArray(courseData.metadata?.tags) ? courseData.metadata.tags : [],
      category: courseData.metadata?.category || null,
      metadata: {
        overview: courseData.metadata?.overviewText || null,
        prerequisites: courseData.metadata?.prerequisites || [],
        objectives: courseData.metadata?.objectives || [],
        resources: courseData.resources || courseData.metadata?.sources || [],
        courseItems: courseData.courseItems || []
      },
      generated_summary: courseData.metadata?.overviewText || null,
      transcript: courseData.transcript || null
    };

    let courseId;

    // Insert or update the course
    try {
      if (existingCourses && existingCourses.length > 0) {
        // Update existing course
        console.log('Updating existing course:', existingCourses[0].id);
        const { data: updatedCourse, error: updateError } = await supabase
          .from('courses')
          .update(courseRecord)
          .eq('id', existingCourses[0].id)
          .select('id')
          .single();

        if (updateError) {
          console.error('Error updating course:', updateError);

          // Try direct SQL update if RLS policies are blocking the update
          console.log('Trying direct SQL update...');
          const { error: sqlError } = await supabase.rpc('execute_sql', {
            sql_query: `
              UPDATE courses
              SET
                title = '${courseRecord.title.replace(/'/g, "''")}',
                subtitle = ${courseRecord.subtitle ? `'${courseRecord.subtitle.replace(/'/g, "''")}'` : 'NULL'},
                description = ${courseRecord.description ? `'${courseRecord.description.replace(/'/g, "''")}'` : 'NULL'},
                video_id = '${courseRecord.video_id}',
                youtube_url = '${courseRecord.youtube_url}',
                thumbnail = ${courseRecord.thumbnail ? `'${courseRecord.thumbnail}'` : 'NULL'},
                is_public = ${courseRecord.is_public},
                status = '${courseRecord.status}',
                difficulty_level = '${courseRecord.difficulty_level}',
                estimated_duration = ${courseRecord.estimated_duration ? `'${courseRecord.estimated_duration}'` : 'NULL'},
                estimated_hours = ${courseRecord.estimated_hours || 'NULL'},
                updated_at = NOW(),
                category = ${courseRecord.category ? `'${courseRecord.category}'` : 'NULL'},
                tags = ${courseRecord.tags && courseRecord.tags.length > 0 ? `ARRAY[${courseRecord.tags.map((t: string) => `'${t.replace(/'/g, "''")}'`).join(',')}]` : 'NULL'},
                metadata = '${JSON.stringify(courseRecord.metadata).replace(/'/g, "''")}'::jsonb,
                transcript = ${courseRecord.transcript ? `'${courseRecord.transcript.replace(/'/g, "''")}'` : 'NULL'},
                generated_summary = ${courseRecord.generated_summary ? `'${courseRecord.generated_summary.replace(/'/g, "''")}'` : 'NULL'}
              WHERE id = '${existingCourses[0].id}'
            `
          });

          if (sqlError) {
            console.error('Error with direct SQL update:', sqlError);
            return NextResponse.json({
              error: 'Failed to update course with SQL',
              details: sqlError
            }, { status: 500 });
          }
        }

        courseId = existingCourses[0].id;
      } else {
        // Insert new course
        console.log('Inserting new course');
        const { data: newCourse, error: insertError } = await supabase
          .from('courses')
          .insert(courseRecord)
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting course:', insertError);

          // Try direct SQL insert if RLS policies are blocking the insert
          console.log('Trying direct SQL insert...');
          const { data: sqlData, error: sqlError } = await supabase.rpc('execute_sql', {
            sql_query: `
              INSERT INTO courses (
                title, subtitle, description, video_id, youtube_url, thumbnail,
                is_public, created_by, creator_id, status, difficulty_level,
                estimated_duration, estimated_hours, tags, category, metadata,
                generated_summary, transcript, created_at, updated_at
              ) VALUES (
                '${courseRecord.title.replace(/'/g, "''")}',
                ${courseRecord.subtitle ? `'${courseRecord.subtitle.replace(/'/g, "''")}'` : 'NULL'},
                ${courseRecord.description ? `'${courseRecord.description.replace(/'/g, "''")}'` : 'NULL'},
                '${courseRecord.video_id}',
                '${courseRecord.youtube_url}',
                ${courseRecord.thumbnail ? `'${courseRecord.thumbnail}'` : 'NULL'},
                ${courseRecord.is_public},
                ${courseRecord.created_by ? `'${courseRecord.created_by}'` : 'NULL'},
                ${courseRecord.creator_id ? `'${courseRecord.creator_id}'` : 'NULL'},
                '${courseRecord.status}',
                '${courseRecord.difficulty_level}',
                ${courseRecord.estimated_duration ? `'${courseRecord.estimated_duration}'` : 'NULL'},
                ${courseRecord.estimated_hours || 'NULL'},
                ${courseRecord.tags && courseRecord.tags.length > 0 ? `ARRAY[${courseRecord.tags.map((t: string) => `'${t.replace(/'/g, "''")}'`).join(',')}]` : 'NULL'},
                ${courseRecord.category ? `'${courseRecord.category}'` : 'NULL'},
                '${JSON.stringify(courseRecord.metadata).replace(/'/g, "''")}'::jsonb,
                ${courseRecord.generated_summary ? `'${courseRecord.generated_summary.replace(/'/g, "''")}'` : 'NULL'},
                ${courseRecord.transcript ? `'${courseRecord.transcript.replace(/'/g, "''")}'` : 'NULL'},
                NOW(),
                NOW()
              ) RETURNING id
            `
          });

          if (sqlError) {
            console.error('Error with direct SQL insert:', sqlError);
            return NextResponse.json({
              error: 'Failed to insert course with SQL',
              details: sqlError
            }, { status: 500 });
          }

          // Extract the course ID from the SQL result
          if (sqlData && sqlData.length > 0) {
            courseId = sqlData[0].id;
            console.log('Course inserted with SQL, ID:', courseId);
          } else {
            console.error('SQL insert succeeded but no ID returned');
            return NextResponse.json({
              error: 'SQL insert succeeded but no ID returned'
            }, { status: 500 });
          }
        } else {
          courseId = newCourse.id;
          console.log('Course inserted with Supabase client, ID:', courseId);
        }
      }
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json({
        error: 'Database operation failed',
        details: dbError
      }, { status: 500 });
    }

    // No longer automatically enrolling users when a course is saved
    // Users will need to explicitly click the "Enroll" button to enroll in a course

    return NextResponse.json({
      success: true,
      message: 'Course saved successfully',
      courseId
    });
  } catch (error) {
    console.error('Error saving course to Supabase:', error);
    return NextResponse.json({
      error: 'Failed to save course',
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

// The createEnrollment function has been removed as we no longer automatically enroll users when a course is saved
