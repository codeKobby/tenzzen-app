import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

/**
 * Debug endpoint to check Supabase connection and environment variables
 * GET /api/debug/supabase-connection
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authData = await auth();
    const userId = authData.userId;

    if (!userId) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!supabaseUrl,
        value: supabaseUrl ? `${supabaseUrl.substring(0, 8)}...` : null
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!supabaseAnonKey,
        value: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 5)}...` : null
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!supabaseServiceKey,
        value: supabaseServiceKey ? `${supabaseServiceKey.substring(0, 5)}...` : null
      }
    };

    // Try to create a Supabase client with anon key
    let anonClientWorks = false;
    let serviceClientWorks = false;
    let tablesExist = false;
    let error = null;

    try {
      if (supabaseUrl && supabaseAnonKey) {
        const anonClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data, error: pingError } = await anonClient.from('users').select('count(*)', { count: 'exact', head: true });
        
        if (!pingError) {
          anonClientWorks = true;
          tablesExist = true;
        } else {
          error = {
            anonClient: {
              message: pingError.message,
              code: pingError.code
            }
          };
        }
      }
    } catch (e) {
      error = {
        anonClient: {
          message: e instanceof Error ? e.message : 'Unknown error',
          stack: e instanceof Error ? e.stack : null
        }
      };
    }

    // Try to create a Supabase client with service role key
    try {
      if (supabaseUrl && supabaseServiceKey) {
        const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
        const { data, error: pingError } = await serviceClient.from('users').select('count(*)', { count: 'exact', head: true });
        
        if (!pingError) {
          serviceClientWorks = true;
          tablesExist = true;
        } else {
          error = {
            ...error,
            serviceClient: {
              message: pingError.message,
              code: pingError.code
            }
          };
        }
      }
    } catch (e) {
      error = {
        ...error,
        serviceClient: {
          message: e instanceof Error ? e.message : 'Unknown error',
          stack: e instanceof Error ? e.stack : null
        }
      };
    }

    return NextResponse.json({
      success: true,
      environmentVariables: envCheck,
      connection: {
        anonClientWorks,
        serviceClientWorks,
        tablesExist
      },
      error
    });
  } catch (error: any) {
    console.error('Error in supabase-connection debug endpoint:', error);
    return NextResponse.json({
      error: 'Failed to check Supabase connection',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
