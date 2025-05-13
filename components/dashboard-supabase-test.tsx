'use client';

import { useState } from 'react';
import { useSupabase } from '@/contexts/supabase-context';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function DashboardSupabaseTest() {
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
      // First, check if we can connect to Supabase at all
      console.log('Testing Supabase connection...');
      console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

      // Get the JWT token from Clerk
      const token = await user.getToken({ template: 'supabase' });
      console.log('Clerk token obtained:', token ? 'Yes' : 'No');

      // Check if the users table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('users')
        .select('count(*)', { count: 'exact', head: true });

      console.log('Table check result:', tableCheck, tableError);

      if (tableError) {
        // If there's an error, it might be because the table doesn't exist
        // or because of authentication issues
        throw new Error(`Table check error: ${tableError.message} (${tableError.code})`);
      }

      // First, ensure the user exists in Supabase
      const userData = {
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "",
        image_url: user.imageUrl,
      };

      console.log('User data to sync:', userData);

      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_id', user.id)
        .single();

      console.log('Existing user check:', existingUser, checkError);

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw new Error(`User check error: ${checkError.message} (${checkError.code})`);
      }

      if (!existingUser) {
        console.log('Creating new user...');
        // Create user if doesn't exist
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single();

        console.log('Insert result:', newUser, insertError);

        if (insertError) {
          throw new Error(`User insert error: ${insertError.message} (${insertError.code})`);
        }

        setResult({
          message: 'User created successfully in Supabase',
          user: newUser
        });
      } else {
        console.log('Updating existing user...');
        // User exists, update
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({
            ...userData,
            updated_at: new Date().toISOString()
          })
          .eq('clerk_id', user.id)
          .select()
          .single();

        console.log('Update result:', updatedUser, updateError);

        if (updateError) {
          throw new Error(`User update error: ${updateError.message} (${updateError.code})`);
        }

        setResult({
          message: 'User updated successfully in Supabase',
          user: updatedUser
        });
      }
    } catch (err: any) {
      console.error('Error testing Supabase connection:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const [setupLoading, setSetupLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<any>(null);
  const [jwtLoading, setJwtLoading] = useState(false);
  const [jwtResult, setJwtResult] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);

  const setupSupabase = async () => {
    setSetupLoading(true);
    setSetupResult(null);

    try {
      const response = await fetch('/api/supabase/setup');
      const result = await response.json();

      console.log('Setup result:', result);

      if (result.error) {
        setSetupResult({
          success: false,
          message: `Setup failed: ${result.error}`
        });
      } else {
        setSetupResult({
          success: true,
          message: result.message
        });
      }
    } catch (err: any) {
      console.error('Error setting up Supabase:', err);
      setSetupResult({
        success: false,
        message: `Setup error: ${err.message || 'Unknown error'}`
      });
    } finally {
      setSetupLoading(false);
    }
  };

  const checkJwtToken = async () => {
    setJwtLoading(true);
    setJwtResult(null);

    try {
      const response = await fetch('/api/clerk/check-jwt');
      const result = await response.json();

      console.log('JWT check result:', result);

      if (result.error) {
        setJwtResult({
          success: false,
          message: `JWT check failed: ${result.error}`
        });
      } else {
        setJwtResult({
          success: true,
          message: `JWT token available: ${result.tokenAvailable}`,
          details: result
        });
      }
    } catch (err: any) {
      console.error('Error checking JWT:', err);
      setJwtResult({
        success: false,
        message: `JWT check error: ${err.message || 'Unknown error'}`
      });
    } finally {
      setJwtLoading(false);
    }
  };

  const checkSupabaseConnection = async () => {
    setCheckLoading(true);
    setCheckResult(null);

    try {
      const response = await fetch('/api/supabase/check');
      const result = await response.json();

      console.log('Supabase check result:', result);

      if (result.error) {
        setCheckResult({
          success: false,
          message: `Supabase check failed: ${result.error}`
        });
      } else {
        setCheckResult({
          success: true,
          message: `Supabase connection: ${result.connection?.status}`,
          details: result
        });
      }
    } catch (err: any) {
      console.error('Error checking Supabase connection:', err);
      setCheckResult({
        success: false,
        message: `Supabase check error: ${err.message || 'Unknown error'}`
      });
    } finally {
      setCheckLoading(false);
    }
  };

  return (
    <Card className="w-full">
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
            <p className="font-medium">{result.message}</p>
            <pre className="mt-2 text-xs overflow-auto max-h-40">
              {JSON.stringify(result.user, null, 2)}
            </pre>
          </div>
        )}

        {setupResult && (
          <div className={`p-4 mb-4 ${setupResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} rounded-md`}>
            <p className="font-medium">Setup Result:</p>
            <p>{setupResult.message}</p>
          </div>
        )}

        {jwtResult && (
          <div className={`p-4 mb-4 ${jwtResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} rounded-md`}>
            <p className="font-medium">JWT Check Result:</p>
            <p>{jwtResult.message}</p>
            {jwtResult.details && (
              <pre className="mt-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(jwtResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        {checkResult && (
          <div className={`p-4 mb-4 ${checkResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'} rounded-md`}>
            <p className="font-medium">Supabase Check Result:</p>
            <p>{checkResult.message}</p>
            {checkResult.details && (
              <pre className="mt-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(checkResult.details, null, 2)}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <Button
            onClick={setupSupabase}
            disabled={setupLoading}
            variant="outline"
            className="flex-1"
          >
            {setupLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting Up...
              </>
            ) : (
              'Setup Supabase Tables'
            )}
          </Button>

          <Button
            onClick={checkJwtToken}
            disabled={jwtLoading}
            variant="outline"
            className="flex-1"
          >
            {jwtLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking JWT...
              </>
            ) : (
              'Check Clerk JWT'
            )}
          </Button>

          <Button
            onClick={checkSupabaseConnection}
            disabled={checkLoading}
            variant="outline"
            className="flex-1"
          >
            {checkLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Connection...
              </>
            ) : (
              'Check Supabase Connection'
            )}
          </Button>
        </div>
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
