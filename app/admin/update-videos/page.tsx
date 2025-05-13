'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function UpdateVideosPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateVideos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/supabase/videos/update-metadata');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update videos');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Update Video Metadata</h1>
      <p className="text-muted-foreground mb-8">
        This tool will update all videos in the database with missing channel avatars and duration information.
      </p>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Update Video Metadata</CardTitle>
          <CardDescription>
            This process will fetch the latest data from YouTube for all videos in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This will update the following fields:
          </p>
          <ul className="list-disc pl-5 text-sm text-muted-foreground mb-4">
            <li>Channel avatar</li>
            <li>Raw duration (ISO 8601 format)</li>
            <li>Duration in seconds</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            The process may take some time depending on the number of videos in the database.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleUpdateVideos} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating Videos...
              </>
            ) : (
              'Update Videos'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Update Results</CardTitle>
            <CardDescription>
              Completed at {new Date().toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-2xl font-bold">{results.total}</p>
                <p className="text-sm text-muted-foreground">Total Videos</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{results.updated}</p>
                <p className="text-sm text-green-600/70 dark:text-green-400/70">Updated</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{results.failed}</p>
                <p className="text-sm text-red-600/70 dark:text-red-400/70">Failed</p>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold mb-3">Details</h3>
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Video ID</th>
                    <th className="p-2 text-left">Status</th>
                    <th className="p-2 text-left">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {results.details.map((detail: any, index: number) => (
                    <tr key={index} className="hover:bg-muted/50">
                      <td className="p-2 font-mono text-xs">{detail.video_id}</td>
                      <td className="p-2">
                        {detail.status === 'updated' && (
                          <span className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Updated
                          </span>
                        )}
                        {detail.status === 'failed' && (
                          <span className="flex items-center text-red-600">
                            <XCircle className="h-4 w-4 mr-1" />
                            Failed
                          </span>
                        )}
                        {detail.status === 'skipped' && (
                          <span className="flex items-center text-amber-600">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Skipped
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">
                        {detail.status === 'updated' && (
                          <span>
                            Avatar: {detail.channel_avatar ? 'Yes' : 'No'}, 
                            Duration: {detail.duration_raw ? 'Yes' : 'No'}
                          </span>
                        )}
                        {detail.status === 'failed' && (
                          <span className="text-red-600">{detail.error}</span>
                        )}
                        {detail.status === 'skipped' && (
                          <span>{detail.reason}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
