import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';

/**
 * API endpoint to set up the streak tracking function in Supabase
 * POST /api/supabase/setup/streak-function
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
    const sqlFilePath = path.join(process.cwd(), 'sql', 'update_user_streak.sql');
    let sql;
    
    try {
      sql = fs.readFileSync(sqlFilePath, 'utf8');
    } catch (error) {
      console.error('Error reading SQL file:', error);
      return NextResponse.json({
        error: 'Failed to read SQL file',
        details: error
      }, { status: 500 });
    }
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sql
    });
    
    if (error) {
      console.error('Error executing SQL:', error);
      return NextResponse.json({
        error: 'Failed to execute SQL',
        details: error
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Streak tracking function set up successfully',
      details: data
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({
      error: 'Unexpected error',
      details: String(error)
    }, { status: 500 });
  }
}
