import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const authData = await auth();
    const userId = authData.userId;

    // Create a Supabase client with the anon key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if we can connect to Supabase
    const { data: healthCheck, error: healthError } = await supabase.rpc('get_service_status');

    if (healthError) {
      return NextResponse.json({
        error: 'Failed to connect to Supabase',
        details: healthError
      }, { status: 500 });
    }

    // Check if the users table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });

    // If the user is authenticated, check if they exist in Supabase
    let userData = null;
    let userError = null;

    if (userId) {
      // Create a Supabase client with the Clerk token
      const getToken = authData.getToken;
      const clerkToken = await getToken({ template: 'supabase' });
      const token = clerkToken || '';
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
            },
          },
        }
      );

      // Check if the user exists in Supabase
      const { data: user, error: userCheckError } = await authClient
        .from('users')
        .select('*')
        .eq('clerk_id', userId)
        .single();

      userData = user;
      userError = userCheckError;
    }

    return NextResponse.json({
      success: true,
      connection: {
        status: 'connected',
        health: healthCheck,
      },
      tables: {
        users: {
          exists: !tableError,
          error: tableError ? tableError.message : null,
        },
      },
      auth: {
        userId,
        authenticated: !!userId,
        user: userData,
        error: userError ? userError.message : null,
      }
    });
  } catch (error: any) {
    console.error('Error checking Supabase connection:', error);
    return NextResponse.json({
      error: 'Failed to check Supabase connection',
      details: error.message
    }, { status: 500 });
  }
}
