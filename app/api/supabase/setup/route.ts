import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    // Create a Supabase client with the anon key
    // Note: For table creation, we would normally use a service role key,
    // but for this demo we'll check if tables exist and return a message
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if the users table exists
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });

    // Check if the courses table exists
    const { data: coursesData, error: coursesError } = await supabase
      .from('courses')
      .select('count(*)', { count: 'exact', head: true });

    // Check if the user_profiles table exists
    const { data: profilesData, error: profilesError } = await supabase
      .from('user_profiles')
      .select('count(*)', { count: 'exact', head: true });

    // Check if the user_stats table exists
    const { data: statsData, error: statsError } = await supabase
      .from('user_stats')
      .select('count(*)', { count: 'exact', head: true });

    // Check if the enrollments table exists
    const { data: enrollmentsData, error: enrollmentsError } = await supabase
      .from('enrollments')
      .select('count(*)', { count: 'exact', head: true });

    // Determine which tables exist
    const tablesStatus = {
      users: !usersError,
      courses: !coursesError,
      user_profiles: !profilesError,
      user_stats: !statsError,
      enrollments: !enrollmentsError
    };

    // Check if all required tables exist
    const allTablesExist = Object.values(tablesStatus).every(status => status);

    if (allTablesExist) {
      return NextResponse.json({
        success: true,
        message: 'All required tables exist',
        tablesStatus
      });
    } else {
      // In a production environment, you would create the missing tables here
      // using a service role key, but for this demo we'll just return a message
      return NextResponse.json({
        success: false,
        message: 'Some tables are missing. Please create them in the Supabase dashboard.',
        tablesStatus
      }, { status: 200 }); // Return 200 to avoid triggering an error in the client
    }
  } catch (error) {
    console.error('Error setting up Supabase:', error);

    // Provide more detailed error information
    let errorMessage = 'Failed to set up Supabase';
    let errorDetails = {};

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        name: error.name,
        stack: error.stack,
        cause: error.cause
      };
    }

    return NextResponse.json({
      error: errorMessage,
      details: errorDetails,
      env: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }, { status: 500 });
  }
}
