import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { refreshAllCategoryCounts } from '@/lib/utils/update-categories';
import { auth } from '@clerk/nextjs/server';

/**
 * API route to refresh all category counts
 * This is useful for fixing inconsistencies in the database
 * Only authenticated users can access this endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = createClient();
    
    // Refresh all category counts
    const result = await refreshAllCategoryCounts(supabase);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to refresh category counts', details: result.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Category counts refreshed successfully',
      updatedCategories: result.updatedCategories
    });
  } catch (error) {
    console.error('Error in category refresh API:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
