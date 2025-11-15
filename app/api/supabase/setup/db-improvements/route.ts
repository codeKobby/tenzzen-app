import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to apply database improvements
 * This route reads the SQL file and executes it to implement the recommended improvements
 * POST /api/supabase/setup/db-improvements
 */
export async function POST(req: NextRequest) {
  // Get the authenticated user
  const authData = await auth();
  const userId = authData.userId;

  if (!userId) {
    return NextResponse.json({
      error: 'Authentication required'
    }, { status: 401 });
  }
  try {
    // Create a Supabase admin client
    const supabase = createAdminSupabaseClient();

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'public', 'db-structure-improvements.sql');
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
            statement: statement.substring(0, 100) + '...',
            success: false,
            error: error.message
          });
        } else {
          results.push({
            statement: statement.substring(0, 100) + '...',
            success: true
          });
        }
      } catch (err: any) {
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: false,
          error: err.message
        });
      }
    }

    // Count the number of successful and failed statements
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Return the results
    return NextResponse.json({
      success: true,
      message: `Applied ${successCount} database improvements successfully. ${failureCount} operations failed.`,
      results
    });
  } catch (error: any) {
    console.error('Error applying database improvements:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
