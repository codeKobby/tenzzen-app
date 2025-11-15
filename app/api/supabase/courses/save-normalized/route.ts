import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';

/**
 * API endpoint to save a generated course to Supabase using the normalized database structure
 * POST /api/supabase/courses/save-normalized
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
    console.log('Saving course to Supabase (normalized):', {
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

    // Step 1: Check if video already exists in videos table
    let videoId;
    const { data: existingVideo, error: videoQueryError } = await supabase
      .from('videos')
      .select('id')
      .eq('youtube_id', courseData.videoId)
      .limit(1);

    if (videoQueryError) {
      console.error('Error checking for existing video:', videoQueryError);
      return NextResponse.json({
        error: 'Failed to check for existing video',
        details: videoQueryError
      }, { status: 500 });
    }

    // Step 2: Insert or get video record
    if (existingVideo && existingVideo.length > 0) {
      videoId = existingVideo[0].id;
      console.log('Using existing video record:', videoId);
    } else {
      // Insert new video record
      const videoRecord = {
        youtube_id: courseData.videoId,
        title: courseData.title,
        description: courseData.description || null,
        thumbnail: courseData.thumbnail || courseData.image || null,
        transcript: courseData.transcript || null
      };

      const { data: newVideo, error: videoInsertError } = await supabase
        .from('videos')
        .insert(videoRecord)
        .select('id')
        .single();

      if (videoInsertError) {
        console.error('Error inserting video:', videoInsertError);
        return NextResponse.json({
          error: 'Failed to insert video',
          details: videoInsertError
        }, { status: 500 });
      }

      videoId = newVideo.id;
      console.log('Inserted new video record:', videoId);
    }

    // Step 3: Check if course already exists
    let courseId;
    const { data: existingCourses, error: courseQueryError } = await supabase
      .from('courses')
      .select('id')
      .eq('video_reference', videoId)
      .limit(1);

    if (courseQueryError) {
      console.error('Error checking for existing course:', courseQueryError);
      return NextResponse.json({
        error: 'Failed to check for existing course',
        details: courseQueryError
      }, { status: 500 });
    }

    // Step 4: Prepare course data
    const courseRecord = {
      title: courseData.title,
      subtitle: courseData.subtitle || courseData.metadata?.overviewText?.substring(0, 100) || null,
      description: courseData.description || null,
      video_reference: videoId,
      youtube_id: courseData.videoId, // Keep for backward compatibility
      thumbnail: courseData.thumbnail || courseData.image || null,
      is_public: true, // Make all generated courses public by default
      created_by: userId ? await getUserIdFromClerkId(supabase, userId) : null,
      creator_id: userId || null, // Store Clerk ID as backup
      status: 'published',
      difficulty_level: courseData.metadata?.difficulty || 'beginner',
      estimated_duration: courseData.metadata?.duration ? `${courseData.metadata.duration} hours` : null,
      estimated_hours: parseFloat(courseData.metadata?.duration) || null,
      metadata: {
        overview: courseData.metadata?.overviewText || null,
        prerequisites: courseData.metadata?.prerequisites || [],
        objectives: courseData.metadata?.objectives || [],
        resources: courseData.resources || courseData.metadata?.sources || []
      },
      generated_summary: courseData.metadata?.overviewText || null
    };

    // Step 5: Insert or update course
    if (existingCourses && existingCourses.length > 0) {
      // Update existing course
      courseId = existingCourses[0].id;
      console.log('Updating existing course:', courseId);
      
      const { error: updateError } = await supabase
        .from('courses')
        .update(courseRecord)
        .eq('id', courseId);

      if (updateError) {
        console.error('Error updating course:', updateError);
        return NextResponse.json({
          error: 'Failed to update course',
          details: updateError
        }, { status: 500 });
      }
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
        return NextResponse.json({
          error: 'Failed to insert course',
          details: insertError
        }, { status: 500 });
      }

      courseId = newCourse.id;
      console.log('Course inserted with ID:', courseId);
    }

    // Step 6: Process course sections and lessons
    if (Array.isArray(courseData.courseItems) && courseData.courseItems.length > 0) {
      // First, delete existing sections and lessons (cascade will handle lessons)
      const { error: deleteError } = await supabase
        .from('course_sections')
        .delete()
        .eq('course_id', courseId);

      if (deleteError) {
        console.error('Error deleting existing sections:', deleteError);
        // Continue anyway, as this might be a new course
      }

      // Insert new sections and lessons
      for (let i = 0; i < courseData.courseItems.length; i++) {
        const section = courseData.courseItems[i];
        
        // Insert section
        const sectionRecord = {
          course_id: courseId,
          title: section.title,
          description: section.description || null,
          order_index: i,
          objective: section.objective || null,
          key_points: section.keyPoints || null,
          assessment_type: section.assessment || null
        };

        const { data: newSection, error: sectionError } = await supabase
          .from('course_sections')
          .insert(sectionRecord)
          .select('id')
          .single();

        if (sectionError) {
          console.error('Error inserting section:', sectionError);
          continue; // Skip to next section if this one fails
        }

        // Insert lessons for this section
        if (Array.isArray(section.lessons)) {
          for (let j = 0; j < section.lessons.length; j++) {
            const lesson = section.lessons[j];
            
            const lessonRecord = {
              section_id: newSection.id,
              title: lesson.title,
              content: lesson.content || lesson.description || null,
              video_timestamp: lesson.videoTimestamp || lesson.startTime || null,
              duration: lesson.duration || (lesson.endTime && lesson.startTime ? lesson.endTime - lesson.startTime : null),
              order_index: j,
              key_points: lesson.keyPoints || null,
              resources: lesson.resources || null
            };

            const { error: lessonError } = await supabase
              .from('course_lessons')
              .insert(lessonRecord);

            if (lessonError) {
              console.error('Error inserting lesson:', lessonError);
              // Continue to next lesson
            }
          }
        }
      }
    }

    // Step 7: Process categories and tags
    if (courseData.metadata?.category) {
      // Get or create category
      let categoryId;
      const { data: existingCategory, error: categoryQueryError } = await supabase
        .from('categories')
        .select('id')
        .eq('name', courseData.metadata.category)
        .limit(1);

      if (categoryQueryError) {
        console.error('Error checking for existing category:', categoryQueryError);
      } else if (existingCategory && existingCategory.length > 0) {
        categoryId = existingCategory[0].id;
      } else {
        // Create new category
        const { data: newCategory, error: categoryInsertError } = await supabase
          .from('categories')
          .insert({
            name: courseData.metadata.category,
            slug: courseData.metadata.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          })
          .select('id')
          .single();

        if (categoryInsertError) {
          console.error('Error inserting category:', categoryInsertError);
        } else {
          categoryId = newCategory.id;
        }
      }

      // Link course to category
      if (categoryId) {
        const { error: linkError } = await supabase
          .from('course_categories')
          .insert({
            course_id: courseId,
            category_id: categoryId
          })
          .on_conflict(['course_id', 'category_id'])
          .ignore();

        if (linkError) {
          console.error('Error linking course to category:', linkError);
        }
      }
    }

    // Process tags
    if (Array.isArray(courseData.metadata?.tags) && courseData.metadata.tags.length > 0) {
      for (const tagName of courseData.metadata.tags) {
        // Get or create tag
        let tagId;
        const { data: existingTag, error: tagQueryError } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .limit(1);

        if (tagQueryError) {
          console.error('Error checking for existing tag:', tagQueryError);
          continue;
        }

        if (existingTag && existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          // Create new tag
          const { data: newTag, error: tagInsertError } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select('id')
            .single();

          if (tagInsertError) {
            console.error('Error inserting tag:', tagInsertError);
            continue;
          }
          tagId = newTag.id;
        }

        // Link course to tag
        if (tagId) {
          const { error: linkError } = await supabase
            .from('course_tags')
            .insert({
              course_id: courseId,
              tag_id: tagId
            })
            .on_conflict(['course_id', 'tag_id'])
            .ignore();

          if (linkError) {
            console.error('Error linking course to tag:', linkError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Course saved successfully using normalized structure',
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
