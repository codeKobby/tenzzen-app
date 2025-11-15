'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useSupabase } from '@/contexts/supabase-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestSupabasePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const supabase = useSupabase();
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Function to fetch the current user from Supabase
  const fetchSupabaseUser = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Check if user exists in Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .single();
        
      if (error) {
        console.error('Error fetching user from Supabase:', error);
        setError(`Error fetching user: ${error.message}`);
        setSupabaseUser(null);
      } else {
        console.log('User found in Supabase:', data);
        setSupabaseUser(data);
        setSuccess('Successfully fetched user from Supabase');
      }
    } catch (err) {
      console.error('Exception fetching user:', err);
      setError(`Exception: ${err instanceof Error ? err.message : String(err)}`);
      setSupabaseUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Function to manually create a user in Supabase
  const createSupabaseUser = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const userData = {
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "",
        image_url: user.imageUrl,
        auth_provider: 'clerk',
        role: 'user',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_login: {
          time: new Date().toISOString()
        }
      };
      
      console.log('Creating user in Supabase:', userData);
      
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
        
      if (error) {
        console.error('Error creating user in Supabase:', error);
        setError(`Error creating user: ${error.message}`);
      } else {
        console.log('Successfully created user in Supabase:', data);
        setSupabaseUser(data);
        setSuccess('Successfully created user in Supabase');
      }
    } catch (err) {
      console.error('Exception creating user:', err);
      setError(`Exception: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to check Supabase connection
  const checkSupabaseConnection = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const { data, error } = await supabase.from('users').select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error connecting to Supabase:', error);
        setError(`Error connecting to Supabase: ${error.message}`);
      } else {
        console.log('Successfully connected to Supabase');
        setSuccess('Successfully connected to Supabase');
      }
    } catch (err) {
      console.error('Exception connecting to Supabase:', err);
      setError(`Exception: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Supabase Integration Test</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current user authentication status</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoaded ? (
              isSignedIn ? (
                <div>
                  <p className="text-green-600 font-medium">✅ Signed in as {user?.fullName || user?.username}</p>
                  <p>User ID: {user?.id}</p>
                  <p>Email: {user?.emailAddresses[0]?.emailAddress}</p>
                </div>
              ) : (
                <p className="text-red-600 font-medium">❌ Not signed in</p>
              )
            ) : (
              <p>Loading authentication status...</p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection</CardTitle>
            <CardDescription>Test connection to Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={checkSupabaseConnection} disabled={loading}>
              {loading ? 'Checking...' : 'Check Connection'}
            </Button>
          </CardContent>
        </Card>
        
        {isSignedIn && (
          <Card>
            <CardHeader>
              <CardTitle>Supabase User</CardTitle>
              <CardDescription>Fetch or create user in Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <Button onClick={fetchSupabaseUser} disabled={loading}>
                  {loading ? 'Fetching...' : 'Fetch User'}
                </Button>
                <Button onClick={createSupabaseUser} disabled={loading} variant="outline">
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>
              
              {supabaseUser && (
                <div className="mt-4 p-4 bg-gray-100 rounded-md">
                  <h3 className="font-medium mb-2">User Data:</h3>
                  <pre className="text-xs overflow-auto">{JSON.stringify(supabaseUser, null, 2)}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {(error || success) && (
          <Card>
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              {error && <p className="text-red-600">{error}</p>}
              {success && <p className="text-green-600">{success}</p>}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
