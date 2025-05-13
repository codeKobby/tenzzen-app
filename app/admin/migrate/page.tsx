'use client';

import { MigrateDataButton } from '@/components/admin/migrate-data-button';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MigratePage() {
  const { user, isLoaded } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }

    // Check if user is admin
    // In a real app, you would check this from your database
    if (user?.primaryEmailAddress?.emailAddress === 'kgeorge1417@gmail.com') {
      setIsAdmin(true);
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground mb-6">You do not have permission to access this page.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Database Migration</h1>
        <p className="text-muted-foreground">
          Migrate data from Convex to Supabase. This is an admin-only feature.
        </p>
      </div>

      <div className="mb-8">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
          <h2 className="text-lg font-medium text-amber-800 mb-2">Important Notes</h2>
          <ul className="list-disc list-inside text-amber-700 space-y-1">
            <li>This migration tool will transfer data from Convex to Supabase.</li>
            <li>The process may take some time depending on the amount of data.</li>
            <li>It's recommended to run this during low traffic periods.</li>
            <li>Both databases will continue to work during the migration period.</li>
            <li>New data will be synchronized to both databases automatically.</li>
          </ul>
        </div>
      </div>

      <MigrateDataButton />
    </div>
  );
}
