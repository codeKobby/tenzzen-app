import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

/**
 * API endpoint to add missing columns to the courses table
 * GET /api/supabase/setup/add-columns
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

    // Create a Supabase client with the service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // SQL to add missing columns
    const sql = `
      -- Add missing columns to the courses table
      ALTER TABLE IF EXISTS courses 
      ADD COLUMN IF NOT EXISTS transcript TEXT,
      ADD COLUMN IF NOT EXISTS course_items JSONB DEFAULT '[]'::jsonb;

      -- Comment on the new columns
      COMMENT ON COLUMN courses.transcript IS 'Full transcript of the video content';
      COMMENT ON COLUMN courses.course_items IS 'JSON array of course sections and lessons';

      -- Create an index on the video_id column for faster lookups
      CREATE INDEX IF NOT EXISTS courses_video_id_idx ON courses(video_id);
    `;

    // Execute the SQL
    const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });

    if (error) {
      console.error('Error adding columns:', error);
      return NextResponse.json({
        error: 'Failed to add columns',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Columns added successfully',
      data
    });
  } catch (error) {
    console.error('Error adding columns:', error);
    return NextResponse.json({
      error: 'Failed to add columns',
      details: error
    }, { status: 500 });
  }
}
