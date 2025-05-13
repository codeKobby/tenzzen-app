'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

export default function TestPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const testConnection = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('Testing Supabase connection...');
      const response = await fetch('/api/supabase/test');
      const data = await response.json();
      console.log('Test response:', data);
      setResult(data);
    } catch (err: any) {
      console.error('Error testing connection:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>
            Test the connection to your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {result && (
            <div className="mb-4 space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
              
              {result.error && (
                <div className="bg-muted p-4 rounded-md overflow-auto">
                  <pre className="text-xs">{JSON.stringify(result.error, null, 2)}</pre>
                </div>
              )}
              
              {result.data && (
                <div className="bg-muted p-4 rounded-md overflow-auto">
                  <pre className="text-xs">{JSON.stringify(result.data, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            <p>
              This page helps you test the connection to your Supabase database.
              Click the button below to test the connection.
            </p>
            
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium mb-2">Environment Variables:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Not set'}</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set'}</li>
              </ul>
            </div>
            
            <p>
              If the test fails, check your Supabase URL and anon key in the .env.local file.
              Also, make sure your Supabase project is active and accessible.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={testConnection} 
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Testing Connection...' : 'Test Connection'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
