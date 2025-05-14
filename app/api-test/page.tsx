"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ApiTestPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [healthData, setHealthData] = useState<any>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [syncData, setSyncData] = useState<any>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [loading, setLoading] = useState<{ health: boolean; sync: boolean }>({
    health: false,
    sync: false,
  });
  const [retryCount, setRetryCount] = useState<{ health: number; sync: number }>({
    health: 0,
    sync: 0,
  });

  // Helper function to implement retry logic with exponential backoff
  const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3, initialTimeout = 30000) => {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries < maxRetries) {
      try {
        // Increase timeout with each retry (exponential backoff)
        const timeout = initialTimeout * Math.pow(2, retries);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const fetchOptions = {
          ...options,
          signal: controller.signal
        };

        console.log(`Test Page: Fetch attempt ${retries + 1}/${maxRetries} with timeout ${timeout}ms`);
        const response = await fetch(url, fetchOptions);

        // Clear the timeout to prevent memory leaks
        clearTimeout(timeoutId);

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        retries++;

        // Update retry count state
        if (url.includes('health')) {
          setRetryCount(prev => ({ ...prev, health: retries }));
        } else if (url.includes('sync')) {
          setRetryCount(prev => ({ ...prev, sync: retries }));
        }

        // Check if we've reached the maximum number of retries
        if (retries >= maxRetries) {
          console.error(`Test Page: Max retries (${maxRetries}) reached for ${url}`);
          throw lastError;
        }

        // Check if it's a timeout error
        const isTimeout = lastError.name === 'TimeoutError' ||
                         lastError.name === 'AbortError' ||
                         lastError.message.includes('timeout') ||
                         lastError.message.includes('aborted');

        if (!isTimeout) {
          console.error(`Test Page: Non-timeout error, not retrying:`, lastError);
          throw lastError;
        }

        // Calculate backoff delay (exponential with jitter)
        const backoffDelay = Math.min(1000 * Math.pow(2, retries) + Math.random() * 1000, 10000);
        console.warn(`Test Page: Request timed out, retrying in ${backoffDelay}ms (attempt ${retries}/${maxRetries})`);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }

    // This should never be reached due to the throw in the loop, but TypeScript needs it
    throw lastError || new Error('Unknown error during fetch with retry');
  };

  // Check API health
  const checkHealth = async () => {
    setLoading((prev) => ({ ...prev, health: true }));
    setHealthData(null);
    setHealthError(null);
    setRetryCount((prev) => ({ ...prev, health: 0 }));

    try {
      const response = await fetchWithRetry("/api/health", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        }
      }, 3, 10000); // 3 retries, 10 second initial timeout

      const data = await response.json();
      setHealthData(data);
    } catch (error) {
      setHealthError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading((prev) => ({ ...prev, health: false }));
    }
  };

  // Sync user to Supabase
  const syncUser = async () => {
    if (!user) {
      setSyncError("User not authenticated");
      return;
    }

    setLoading((prev) => ({ ...prev, sync: true }));
    setSyncData(null);
    setSyncError(null);
    setRetryCount((prev) => ({ ...prev, sync: 0 }));

    try {
      const userData = {
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "",
        imageUrl: user.imageUrl,
      };

      const response = await fetchWithRetry("/api/users/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(userData)
      }, 3, 30000); // 3 retries, 30 second initial timeout

      // Log response details
      console.log("Response status:", response.status);
      console.log("Response headers:", {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      });

      // Clone the response before parsing to avoid "body already read" errors
      const responseClone = response.clone();

      try {
        const data = await response.json();
        setSyncData(data);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);

        // Try to get the raw text to see what's wrong
        const rawText = await responseClone.text();
        console.error("Raw response text:", rawText.substring(0, 500));
        setSyncError(`Failed to parse JSON response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`);
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading((prev) => ({ ...prev, sync: false }));
    }
  };

  // Run health check on page load
  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">API Test Page</h1>

      {/* Timeout Info Alert */}
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Timeout Handling</AlertTitle>
        <AlertDescription>
          This page uses retry logic with exponential backoff to handle timeouts.
          Requests will automatically retry up to 3 times with increasing timeouts.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Health Check Card */}
        <Card>
          <CardHeader>
            <CardTitle>API Health Check</CardTitle>
            <CardDescription>Check if the API routes are working correctly</CardDescription>
          </CardHeader>
          <CardContent>
            {loading.health ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                {retryCount.health > 0 && (
                  <div className="text-amber-500 text-sm">
                    Retry attempt {retryCount.health}/3...
                  </div>
                )}
              </div>
            ) : healthError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{healthError}</AlertDescription>
              </Alert>
            ) : healthData ? (
              <div className="space-y-2">
                <div>Status: <span className="font-semibold">{healthData.status}</span></div>
                <div>Timestamp: <span className="font-semibold">{healthData.timestamp}</span></div>
                <div>Environment: <span className="font-semibold">{healthData.environment}</span></div>
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Environment Variables:</h4>
                  <ul className="space-y-1">
                    {Object.entries(healthData.environmentVariables || {}).map(([key, value]: [string, any]) => (
                      <li key={key}>
                        {key}: <span className={value ? "text-green-500" : "text-red-500"}>{value ? "✓" : "✗"}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div>No data available</div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={checkHealth} disabled={loading.health}>
              {loading.health ? "Checking..." : "Check Health"}
            </Button>
          </CardFooter>
        </Card>

        {/* User Sync Card */}
        <Card>
          <CardHeader>
            <CardTitle>User Sync Test</CardTitle>
            <CardDescription>Test syncing the current user to Supabase</CardDescription>
          </CardHeader>
          <CardContent>
            {!isLoaded ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !isSignedIn ? (
              <Alert variant="warning">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Authentication Required</AlertTitle>
                <AlertDescription>You need to be signed in to test user sync</AlertDescription>
              </Alert>
            ) : loading.sync ? (
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                {retryCount.sync > 0 && (
                  <div className="text-amber-500 text-sm">
                    Retry attempt {retryCount.sync}/3...
                  </div>
                )}
              </div>
            ) : syncError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{syncError}</AlertDescription>
              </Alert>
            ) : syncData ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span>Success:</span>
                  {syncData.success ? (
                    <span className="text-green-500 flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> Yes
                    </span>
                  ) : (
                    <span className="text-red-500 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" /> No
                    </span>
                  )}
                </div>
                <div>Action: <span className="font-semibold">{syncData.action || "N/A"}</span></div>
                {syncData.user && (
                  <>
                    <div>User ID: <span className="font-semibold">{syncData.user.id}</span></div>
                    <div>Clerk ID: <span className="font-semibold">{syncData.user.clerk_id}</span></div>
                    <div>Email: <span className="font-semibold">{syncData.user.email}</span></div>
                  </>
                )}
                <div>Profile Created: <span className="font-semibold">{syncData.profile_created ? "✓" : "✗"}</span></div>
                <div>Stats Created: <span className="font-semibold">{syncData.stats_created ? "✓" : "✗"}</span></div>
              </div>
            ) : (
              <div>No data available</div>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={syncUser} disabled={loading.sync || !isSignedIn}>
              {loading.sync ? "Syncing..." : "Sync User"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
