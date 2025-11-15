import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase-admin';
import { auth } from '@clerk/nextjs/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to apply database data migration
 * This route reads the SQL file and executes it to migrate data to the normalized structure
 * POST /api/supabase/setup/db-migration
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
    const sqlFilePath = path.join(process.cwd(), 'public', 'db-data-migration.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split('-- ')
      .filter(statement => statement.trim().length > 0)
      .map(statement => {
        // Extract the statement number and description
        const firstLine = statement.split('\n')[0];
        const restOfStatement = statement.substring(firstLine.length);
        return {
          description: firstLine.trim(),
          sql: restOfStatement.trim()
        };
      });
    
    // Execute each statement
    const results = [];
    for (const statement of statements) {
      try {
        console.log(`Executing migration step: ${statement.description}`);
        
        const { data, error } = await supabase.rpc('execute_sql', {
          sql_query: statement.sql
        });
        
        if (error) {
          results.push({
            step: statement.description,
            success: false,
            error: error.message
          });
          console.error(`Error in step ${statement.description}:`, error);
        } else {
          results.push({
            step: statement.description,
            success: true
          });
          console.log(`Successfully completed step: ${statement.description}`);
        }
      } catch (error: any) {
        results.push({
          step: statement.description,
          success: false,
          error: error.message
        });
        console.error(`Exception in step ${statement.description}:`, error);
      }
    }
    
    // Count the number of successful and failed statements
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return NextResponse.json({
      success: true,
      message: `Applied ${successCount} migration steps successfully. ${failureCount} steps failed.`,
      results
    });
  } catch (error: any) {
    console.error('Error applying database migration:', error);
    return NextResponse.json({
      error: 'Failed to apply database migration',
      details: error.message
    }, { status: 500 });
  }
}
