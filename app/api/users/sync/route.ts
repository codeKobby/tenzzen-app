import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API route to sync a user to Supabase using the service role key
 * This bypasses RLS policies and should only be used for user creation/sync
 */
export async function POST(req: NextRequest) {
  try {
    // Get user data from request
    const userData = await req.json();

    if (!userData.clerkId) {
      return NextResponse.json({ error: 'Missing clerk_id' }, { status: 400 });
    }

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

    // Log for debugging
    console.log('Server: Syncing user to Supabase:', userData.clerkId);

    // Use a single SQL transaction to handle everything
    const { data, error } = await supabase.rpc('sync_user', {
      p_clerk_id: userData.clerkId,
      p_email: userData.email || '',
      p_name: userData.name || '',
      p_image_url: userData.imageUrl || '',
      p_auth_provider: 'clerk',
      p_role: 'user',
      p_status: 'active',
      p_last_login: JSON.stringify({ time: new Date().toISOString() })
    });

    if (error) {
      console.error('Server: Error syncing user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Server: Successfully synced user:', data);

    return NextResponse.json({
      user: data.user,
      action: data.action,
      profile_created: data.profile_created,
      stats_created: data.stats_created
    });
  } catch (error) {
    console.error('Server: Unexpected error in user sync:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
