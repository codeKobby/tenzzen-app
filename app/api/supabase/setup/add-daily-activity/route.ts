import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to add daily_activity field to user_stats table
 * POST /api/supabase/setup/add-daily-activity
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

    // Create a Supabase admin client
    const supabase = createAdminSupabaseClient();
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'sql', 'add_daily_activity_field.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL query
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sqlContent
    });

    if (error) {
      return NextResponse.json({
        error: 'Failed to execute SQL',
        details: error
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Daily activity field added to user_stats table'
    });
  } catch (error) {
    console.error('Error adding daily activity field:', error);
    return NextResponse.json({
      error: 'Internal server error'
    }, { status: 500 });
  }
}
