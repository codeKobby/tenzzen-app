import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API route to sync a user to Supabase using the service role key
 * This bypasses RLS policies and should only be used for user creation/sync
 */
// Ensure we always return JSON
export async function POST(req: NextRequest) {
  try {
    // Get user data from request
    let userInput;
    try {
      userInput = await req.json();
    } catch (parseError) {
      console.error('Server: Error parsing request JSON:', parseError);
      return new NextResponse(
        JSON.stringify({ error: 'Invalid JSON in request body', success: false }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!userInput.clerkId) {
      console.error('Server: Missing clerk_id in request');
      return new NextResponse(
        JSON.stringify({ error: 'Missing clerk_id', success: false }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Server: Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
      return new NextResponse(
        JSON.stringify({ error: 'Server configuration error: Missing Supabase URL', success: false }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Server: Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return new NextResponse(
        JSON.stringify({ error: 'Server configuration error: Missing Supabase service role key', success: false }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Create a Supabase client with the service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Log for debugging
    console.log('Server: Syncing user to Supabase:', userInput.clerkId);

    // Implement direct user sync instead of using RPC
    // First check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userInput.clerkId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Server: Error checking if user exists:', checkError);
      return new NextResponse(
        JSON.stringify({
          error: 'Error checking if user exists',
          code: checkError.code,
          message: checkError.message,
          success: false
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Prepare user data
    const now = new Date().toISOString();
    const userData = {
      email: userInput.email || '',
      name: userInput.name || '',
      image_url: userInput.imageUrl || '',
      updated_at: now
    };

    let action = '';
    let user = null;
    let profileCreated = false;
    let statsCreated = false;

    // Update or create user
    if (existingUser) {
      // Update existing user
      console.log('Server: Updating existing user:', userInput.clerkId);
      action = 'updated';

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('clerk_id', userInput.clerkId)
        .select()
        .single();

      if (updateError) {
        console.error('Server: Error updating user:', updateError);
        return new NextResponse(
          JSON.stringify({
            error: 'Error updating user',
            code: updateError.code,
            message: updateError.message,
            success: false
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );
      }

      user = updatedUser;
    } else {
      // Create new user
      console.log('Server: Creating new user:', userInput.clerkId);
      action = 'created';

      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          clerk_id: userInput.clerkId,
          ...userData,
          auth_provider: 'clerk',
          role: 'user',
          status: 'active',
          created_at: now,
          last_login: { time: now }
        })
        .select()
        .single();

      if (createError) {
        console.error('Server: Error creating user:', createError);
        return new NextResponse(
          JSON.stringify({
            error: 'Error creating user',
            code: createError.code,
            message: createError.message,
            success: false
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          }
        );
      }

      user = newUser;

      // Initialize user profile and stats
      if (user) {
        try {
          // Create user profile
          const { error: profileError } = await supabase
            .from('user_profiles')
            .insert({ user_id: user.id });

          if (profileError) {
            console.error('Server: Error creating user profile:', profileError);
          } else {
            profileCreated = true;
          }

          // Create user stats
          const { error: statsError } = await supabase
            .from('user_stats')
            .insert({ user_id: user.id });

          if (statsError) {
            console.error('Server: Error creating user stats:', statsError);
          } else {
            statsCreated = true;
          }
        } catch (initError) {
          console.error('Server: Error initializing user profile or stats:', initError);
        }
      }
    }

    // If we got here, user should be valid
    if (!user) {
      console.error('Server: No user data available after sync');
      return new NextResponse(
        JSON.stringify({
          error: 'Internal server error: No user data available',
          success: false
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    console.log('Server: Successfully synced user:', user.id);

    // Return success response
    return new NextResponse(
      JSON.stringify({
        user,
        action,
        profile_created: profileCreated,
        stats_created: statsCreated,
        success: true
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Server: Unexpected error in user sync:', error);

    // Get detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : null;

    console.error('Server: Error details:', {
      message: errorMessage,
      stack: errorStack
    });

    // Ensure we always return a valid JSON response
    try {
      // Return error response
      return new NextResponse(
        JSON.stringify({
          error: errorMessage,
          success: false
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    } catch (responseError) {
      // If JSON.stringify fails for some reason, return a simple error
      console.error('Server: Error creating error response:', responseError);
      return new NextResponse(
        '{"error":"Internal server error","success":false}',
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }
  }
}
