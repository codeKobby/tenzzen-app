'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function SetupPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkTables = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/supabase/setup');
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      console.error('Error checking tables:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Supabase Database Setup</CardTitle>
          <CardDescription>
            Check and create the required tables for the application
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
              <div className="font-medium text-lg">{result.message}</div>

              {result.tablesStatus && (
                <div className="space-y-2">
                  <div className="font-medium">Table Status:</div>
                  <ul className="space-y-1">
                    {Object.entries(result.tablesStatus).map(([table, exists]: [string, any]) => (
                      <li key={table} className="flex items-center gap-2">
                        {exists ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                        <span>{table}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <p>
              This page helps you check if the required database tables exist in your Supabase project.
              If tables are missing, you'll need to create them manually in the Supabase dashboard.
            </p>

            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium mb-2">Required Tables:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>users</li>
                <li>user_profiles</li>
                <li>user_stats</li>
                <li>courses</li>
                <li>enrollments</li>
              </ul>
            </div>

            <p>
              To create these tables, go to the Supabase dashboard, select your project,
              navigate to the SQL Editor, and run the SQL scripts to create the tables.
            </p>

            <div className="mt-4">
              <a
                href="/setup-tables.sql"
                download
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                Download SQL Script
              </a>
              <p className="text-sm text-muted-foreground mt-1">
                Download this SQL script and run it in the Supabase SQL Editor to create all required tables.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={checkTables}
            disabled={loading}
            className="w-full"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? 'Checking Tables...' : 'Check Tables'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
