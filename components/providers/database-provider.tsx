'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { SupabaseProvider } from '@/contexts/supabase-context';

interface DatabaseProviderProps {
  children: ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  return (
    <ClerkProvider>
      <SupabaseProvider>
        {children}
      </SupabaseProvider>
    </ClerkProvider>
  );
}
