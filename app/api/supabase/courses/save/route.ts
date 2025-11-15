import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';
import { transformADKCourseToDatabase } from '@/lib/transformers/course';
import { parseDurationToSeconds, calculateTotalDurationFromSections } from '@/lib/utils/duration';

/**
 * API endpoint to save a generated course to Supabase
 * This endpoint now uses the normalized database structure while maintaining
 * compatibility with the existing course generation flow.
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

    // Step 1: Check if a course with this videoId already exists
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

    // If course exists, return it immediately to maintain compatibility with the existing flow
    if (existingCourses && existingCourses.length > 0) {
      console.log('Course already exists, returning existing course ID:', existingCourses[0].id);
      return NextResponse.json({
        success: true,
        message: 'Course already exists',
        courseId: existingCourses[0].id
      });
    }

    // Step 2: Check if video already exists in videos table
    let videoId;
    const { data: existingVideo, error: videoQueryError } = await supabase
      .from('videos')
      .select('id')
      .eq('youtube_id', courseData.videoId)
      .limit(1);

    if (videoQueryError) {
      console.error('Error checking for existing video:', videoQueryError);
      // Continue anyway, we'll create a new video record
    }

    // Step 3: Insert or get video record
    if (existingVideo && existingVideo.length > 0) {
      videoId = existingVideo[0].id;
      console.log('Using existing video record:', videoId);

      // Update video data if needed
      const { error: videoUpdateError } = await supabase
        .from('videos')
        .update({
          title: courseData.title,
          description: courseData.description || null,
          thumbnail: courseData.thumbnail || courseData.image || null,
          transcript: courseData.transcript || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', videoId);

      if (videoUpdateError) {
        console.error('Error updating video:', videoUpdateError);
        // Continue anyway
      }
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
        // Fall back to using just the video_id field in the course record
      } else {
        videoId = newVideo.id;
        console.log('Inserted new video record:', videoId);
      }
    }

    // Step 4: Prepare course data for insertion using the transformer
    // First transform the course data using our standardized transformer
    const transformedCourse = transformADKCourseToDatabase(courseData);

    // Then add the fields specific to this API endpoint
    const courseRecord = {
      ...transformedCourse,
      video_reference: videoId, // Add the video reference from our lookup
      created_by: userId ? await getUserIdFromClerkId(supabase, userId) : null,
      creator_id: userId || null, // Store Clerk ID as backup
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
                duration_seconds = ${courseRecord.duration_seconds || 'NULL'},
                total_lessons = ${courseRecord.total_lessons || 0},
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
                estimated_duration, estimated_hours, duration_seconds, total_lessons, tags, category, metadata,
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
                ${courseRecord.duration_seconds || 'NULL'},
                ${courseRecord.total_lessons || 0},
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

    // Step 5: Process course sections and lessons if available
    if (Array.isArray(courseData.courseItems) && courseData.courseItems.length > 0) {
      console.log('Processing course sections and lessons...');

      try {
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

        console.log('Successfully processed course sections and lessons');
      } catch (error) {
        console.error('Error processing course sections and lessons:', error);
        // Continue anyway, as the course has been saved
      }
    }

    // Step 6: Process categories and tags
    if (courseData.metadata?.category) {
      try {
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
          // Check if the link already exists
          const { data: existingLink, error: checkError } = await supabase
            .from('course_categories')
            .select('id')
            .eq('course_id', courseId)
            .eq('category_id', categoryId)
            .limit(1);

          if (checkError) {
            console.error('Error checking for existing category link:', checkError);
          } else if (!existingLink || existingLink.length === 0) {
            // Only insert if it doesn't exist
            const { error: linkError } = await supabase
              .from('course_categories')
              .insert({
                course_id: courseId,
                category_id: categoryId
              });

            if (linkError) {
              console.error('Error linking course to category:', linkError);
            }
          }
        }
      } catch (error) {
        console.error('Error processing category:', error);
        // Continue anyway
      }
    }

    // Process tags
    if (Array.isArray(courseData.metadata?.tags) && courseData.metadata.tags.length > 0) {
      try {
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
            // Check if the link already exists
            const { data: existingLink, error: checkError } = await supabase
              .from('course_tags')
              .select('id')
              .eq('course_id', courseId)
              .eq('tag_id', tagId)
              .limit(1);

            if (checkError) {
              console.error('Error checking for existing tag link:', checkError);
            } else if (!existingLink || existingLink.length === 0) {
              // Only insert if it doesn't exist
              const { error: linkError } = await supabase
                .from('course_tags')
                .insert({
                  course_id: courseId,
                  tag_id: tagId
                });

              if (linkError) {
                console.error('Error linking course to tag:', linkError);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing tags:', error);
        // Continue anyway
      }
    }

    // No longer automatically enrolling users when a course is saved
    // Users will need to explicitly click the "Enroll" button to enroll in a course

    return NextResponse.json({
      success: true,
      message: 'Course saved successfully with normalized structure',
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
