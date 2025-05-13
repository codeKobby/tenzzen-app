'use client';

import { SupabaseTest } from '@/components/supabase-test';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SupabaseTestPage() {
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
        <h1 className="text-3xl font-bold mb-2">Supabase Integration Test</h1>
        <p className="text-muted-foreground">
          Test the connection to Supabase with Clerk authentication.
        </p>
      </div>

      <div className="flex justify-center">
        <SupabaseTest />
      </div>
    </div>
  );
}
