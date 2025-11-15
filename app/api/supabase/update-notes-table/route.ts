import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to update the user_notes table with new fields
 * POST /api/supabase/update-notes-table
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
    const sqlFilePath = path.join(process.cwd(), 'sql', 'update_user_notes.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL query
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('Error updating user_notes table:', error);
      return NextResponse.json({
        error: 'Failed to update user_notes table',
        details: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User notes table updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating user_notes table:', error);
    return NextResponse.json({
      error: 'Failed to update user_notes table',
      details: error.message
    }, { status: 500 });
  }
}
