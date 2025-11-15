import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to apply database integrity fixes
 * This route reads the SQL file and executes it to implement the recommended fixes
 * POST /api/supabase/setup/db-integrity-fixes
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
    const sqlFilePath = path.join(process.cwd(), 'public', 'db-integrity-fixes.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    const results = [];
    for (const statement of statements) {
      try {
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement
        });
        
        if (error) {
          results.push({
            success: false,
            statement: statement.substring(0, 100) + '...',
            error: error.message
          });
        } else {
          results.push({
            success: true,
            statement: statement.substring(0, 100) + '...'
          });
        }
      } catch (error: any) {
        results.push({
          success: false,
          statement: statement.substring(0, 100) + '...',
          error: error.message
        });
      }
    }
    
    // Migrate existing course_items to normalized tables
    try {
      const { data, error } = await supabase.rpc('migrate_course_items_to_normalized_tables');
      
      if (error) {
        results.push({
          success: false,
          statement: 'Migrate course_items to normalized tables',
          error: error.message
        });
      } else {
        results.push({
          success: true,
          statement: 'Migrate course_items to normalized tables'
        });
      }
    } catch (error: any) {
      results.push({
        success: false,
        statement: 'Migrate course_items to normalized tables',
        error: error.message
      });
    }
    
    // Count the number of successful and failed statements
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Applied ${successCount} database fixes successfully. ${failureCount} operations failed.`,
      results
    });
  } catch (error: any) {
    console.error('Error applying database fixes:', error);
    return NextResponse.json({
      error: 'Failed to apply database fixes',
      details: error.message
    }, { status: 500 });
  }
}
