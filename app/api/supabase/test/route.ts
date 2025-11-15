import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    console.log('Testing Supabase connection...');
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Anon Key set:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        success: false,
        message: 'Supabase URL or Anon Key is missing',
        env: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }
      }, { status: 500 });
    }
    
    // Create a Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    
    // Test a simple query
    const { data, error } = await supabase.from('_test').select('*').limit(1);
    
    if (error) {
      console.error('Supabase query error:', error);
      
      // Try a different query to check if the connection works
      const { data: versionData, error: versionError } = await supabase.rpc('version');
      
      if (versionError) {
        console.error('Supabase version check error:', versionError);
        return NextResponse.json({
          success: false,
          message: 'Failed to connect to Supabase',
          error: versionError
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: 'Connected to Supabase, but _test table does not exist',
        version: versionData
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Supabase',
      data
    });
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing Supabase connection',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
