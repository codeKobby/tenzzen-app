import { createContext, useContext, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useSupabaseClient } from '@/lib/supabase-client';

// Create a context for the Supabase client
const SupabaseContext = createContext<SupabaseClient | null>(null);

// Provider component
export function SupabaseProvider({ children }: { children: ReactNode }) {
  const supabaseClient = useSupabaseClient();
  
  return (
    <SupabaseContext.Provider value={supabaseClient}>
      {children}
    </SupabaseContext.Provider>
  );
}

// Hook to use the Supabase client
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
}
