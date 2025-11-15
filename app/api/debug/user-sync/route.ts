import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { syncUserToSupabase } from '@/lib/user-sync';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * Debug endpoint to manually trigger user synchronization and check status
 * GET /api/debug/user-sync
 */
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user
    const authData = await auth();
    const userId = authData.userId;

    if (!userId) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get the Clerk user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({
        error: 'Failed to get Clerk user'
      }, { status: 500 });
    }

    // Get the JWT token
    const getToken = authData.getToken;
    const clerkToken = await getToken({ template: 'supabase' });
    const token = clerkToken || '';

    // Decode the token to check its contents (without verification)
    let tokenPayload = null;
    if (token) {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          tokenPayload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        } catch (e) {
          console.error('Error decoding token:', e);
        }
      }
    }

    // Create a Supabase client
    const supabase = await createServerSupabaseClient();

    // Check if the users table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('users')
      .select('count(*)', { count: 'exact', head: true });

    // Check if the user exists in Supabase
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    // Trigger user synchronization
    const syncResult = await syncUserToSupabase(clerkUser);

    // Check if the user exists after synchronization
    const { data: userAfterSync, error: afterSyncError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    return NextResponse.json({
      success: true,
      clerkUser: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      },
      jwt: {
        available: !!token,
        payload: tokenPayload ? {
          sub: tokenPayload.sub,
          aud: tokenPayload.aud,
          role: tokenPayload.role,
        } : null,
      },
      supabase: {
        tableExists: !tableError,
        tableCheck,
        userBeforeSync: existingUser || null,
        userAfterSync: userAfterSync || null,
        syncResult: !!syncResult,
      },
      errors: {
        tableError: tableError ? { message: tableError.message, code: tableError.code } : null,
        userError: userError ? { message: userError.message, code: userError.code } : null,
        afterSyncError: afterSyncError ? { message: afterSyncError.message, code: afterSyncError.code } : null,
      }
    });
  } catch (error: any) {
    console.error('Error in user-sync debug endpoint:', error);
    return NextResponse.json({
      error: 'Failed to check user sync',
      message: error.message
    }, { status: 500 });
  }
}
