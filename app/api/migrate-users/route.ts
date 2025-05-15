import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { migrateUsers } from '../../../scripts/migrate-users';

export async function POST(req: NextRequest) {
  const authData = await auth();
  const userId = authData.userId;

  // Check if user is authenticated
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await migrateUsers();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error migrating users:', error);
    return NextResponse.json({ error: 'Failed to migrate users' }, { status: 500 });
  }
}
