'use client';

import { useState } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function SupabaseTest() {
  const supabase = useSupabase();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testSupabaseConnection = async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      // Test query to get the current user from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      setResult(data);
    } catch (err: any) {
      console.error('Error testing Supabase connection:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
        <CardDescription>
          Test the connection to Supabase with Clerk authentication
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-4 mb-4 bg-red-50 text-red-800 rounded-md">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="p-4 mb-4 bg-green-50 text-green-800 rounded-md">
            <p className="font-medium">Success! User data:</p>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={testSupabaseConnection} 
          disabled={loading || !user}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Test Supabase Connection'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
