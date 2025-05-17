import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint to add standardized duration and lesson count fields to the courses table
 * POST /api/supabase/setup/add-duration-fields
 */
export async function POST(req: NextRequest) {
  try {
    // Create a Supabase admin client
    const supabase = createAdminSupabaseClient();
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'sql', 'add_duration_fields.sql');
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
    
    // Update all existing courses to populate the new fields
    const { data: updateData, error: updateError } = await supabase
      .from('courses')
      .select('id, estimated_hours, estimated_duration, course_items')
      .is('duration_seconds', null);
      
    if (updateError) {
      console.error('Error fetching courses to update:', updateError);
      return NextResponse.json({
        error: 'Failed to fetch courses to update',
        details: updateError
      }, { status: 500 });
    }
    
    // Log the number of courses that need updating
    console.log(`Found ${updateData?.length || 0} courses that need updating`);
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Successfully added duration fields to courses table',
      coursesUpdated: updateData?.length || 0
    });
  } catch (error) {
    console.error('Error adding duration fields:', error);
    return NextResponse.json({
      error: 'Failed to add duration fields',
      details: error
    }, { status: 500 });
  }
}
