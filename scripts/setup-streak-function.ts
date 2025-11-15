/**
 * Script to set up the streak tracking function in Supabase
 * Run with: npx tsx scripts/setup-streak-function.ts
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Also load from .env if .env.local doesn't exist

async function main() {
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

  try {
    console.log('Setting up streak tracking function...');

    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'sql', 'update_user_streak.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL directly
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: sql
    });

    if (error) {
      console.error('Error executing SQL:', error);
      process.exit(1);
    }

    console.log('Streak tracking function set up successfully!');
    console.log('You can now use the update_user_streak function to update user streaks.');

    // Check if the function exists
    const { data: functionCheck, error: functionError } = await supabase.rpc('update_user_streak', {
      p_user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      p_current_time: new Date().toISOString()
    });

    if (functionError) {
      if (functionError.code === '42883') { // Function does not exist
        console.error('Function was not created properly. Please check the SQL file.');
      } else if (functionError.code === '22P02') { // Invalid UUID
        console.log('Function exists but requires a valid UUID.');
        console.log('Setup completed successfully!');
      } else {
        console.error('Error checking function:', functionError);
      }
    } else {
      console.log('Function exists and is working properly.');
      console.log('Setup completed successfully!');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
