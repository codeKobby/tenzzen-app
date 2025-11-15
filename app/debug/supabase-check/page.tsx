"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useUser } from "@clerk/nextjs";

export default function SupabaseCheckPage() {
  const { isLoaded, isSignedIn } = useUser();
  const [envCheckResult, setEnvCheckResult] = useState<any>(null);
  const [jwtCheckResult, setJwtCheckResult] = useState<any>(null);
  const [loading, setLoading] = useState({
    env: false,
    jwt: false,
  });

  // Check environment variables
  const checkEnvironmentVariables = async () => {
    setLoading((prev) => ({ ...prev, env: true }));
    try {
      const response = await fetch("/api/debug/env-check");
      const data = await response.json();
      setEnvCheckResult(data);
    } catch (error) {
      console.error("Error checking environment variables:", error);
      setEnvCheckResult({ error: "Failed to check environment variables" });
    } finally {
      setLoading((prev) => ({ ...prev, env: false }));
    }
  };

  // Check JWT template
  const checkJwtTemplate = async () => {
    setLoading((prev) => ({ ...prev, jwt: true }));
    try {
      const response = await fetch("/api/debug/jwt-template-check");
      const data = await response.json();
      setJwtCheckResult(data);
    } catch (error) {
      console.error("Error checking JWT template:", error);
      setJwtCheckResult({ error: "Failed to check JWT template" });
    } finally {
      setLoading((prev) => ({ ...prev, jwt: false }));
    }
  };

  // Run checks on page load
  useEffect(() => {
    if (isLoaded) {
      checkEnvironmentVariables();
      if (isSignedIn) {
        checkJwtTemplate();
      }
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Supabase Connection Check</CardTitle>
            <CardDescription>Loading authentication status...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10 space-y-6">
      <h1 className="text-3xl font-bold">Supabase Connection Check</h1>
      
      {/* Environment Variables Check */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables Check</CardTitle>
          <CardDescription>Checking if Supabase environment variables are properly loaded</CardDescription>
        </CardHeader>
        <CardContent>
          {loading.env ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>Checking environment variables...</span>
            </div>
          ) : envCheckResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-semibold">Supabase Configuration</h3>
                  <div className="flex items-center space-x-2">
                    <span>URL:</span>
                    {envCheckResult.supabase?.url?.defined ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {envCheckResult.supabase?.url?.defined
                        ? `Length: ${envCheckResult.supabase?.url?.length}`
                        : "Not defined"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Anon Key:</span>
                    {envCheckResult.supabase?.anonKey?.defined ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {envCheckResult.supabase?.anonKey?.defined
                        ? `Length: ${envCheckResult.supabase?.anonKey?.length}`
                        : "Not defined"}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Clerk Configuration</h3>
                  <div className="flex items-center space-x-2">
                    <span>Publishable Key:</span>
                    {envCheckResult.clerk?.publishableKey?.defined ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>Secret Key:</span>
                    {envCheckResult.clerk?.secretKey?.defined ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold">Environment</h3>
                <p>Node Environment: {envCheckResult.nodeEnv || "Not defined"}</p>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to check environment variables</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={checkEnvironmentVariables} disabled={loading.env}>
            {loading.env ? "Checking..." : "Check Again"}
          </Button>
        </CardFooter>
      </Card>

      {/* JWT Template Check */}
      <Card>
        <CardHeader>
          <CardTitle>JWT Template Check</CardTitle>
          <CardDescription>Checking if the Clerk JWT template for Supabase is properly configured</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSignedIn ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>You must be signed in to check the JWT template</AlertDescription>
            </Alert>
          ) : loading.jwt ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span>Checking JWT template...</span>
            </div>
          ) : jwtCheckResult ? (
            <div className="space-y-4">
              {jwtCheckResult.error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{jwtCheckResult.error}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span>JWT Token Available:</span>
                      {jwtCheckResult.tokenAvailable ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    {jwtCheckResult.tokenError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>JWT Error</AlertTitle>
                        <AlertDescription>{jwtCheckResult.tokenError.message}</AlertDescription>
                      </Alert>
                    )}
                    {jwtCheckResult.help && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Help</AlertTitle>
                        <AlertDescription>{jwtCheckResult.help}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                  {jwtCheckResult.decodedToken && (
                    <div>
                      <h3 className="font-semibold">Decoded Token</h3>
                      <pre className="bg-muted p-2 rounded-md text-xs mt-2 overflow-auto">
                        {JSON.stringify(jwtCheckResult.decodedToken, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to check JWT template</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={checkJwtTemplate} disabled={loading.jwt || !isSignedIn}>
            {loading.jwt ? "Checking..." : "Check Again"}
          </Button>
        </CardFooter>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Fix Supabase Authentication Issues</CardTitle>
          <CardDescription>Follow these steps to fix Supabase authentication issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">1. Check Environment Variables</h3>
              <p>Make sure the following environment variables are defined in your <code>.env.local</code> file:</p>
              <pre className="bg-muted p-2 rounded-md text-xs mt-2">
                NEXT_PUBLIC_SUPABASE_URL=your-supabase-url<br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
              </pre>
            </div>
            <div>
              <h3 className="font-semibold">2. Configure Clerk JWT Template</h3>
              <p>Create a JWT template in your Clerk dashboard:</p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Go to the Clerk dashboard</li>
                <li>Navigate to JWT Templates</li>
                <li>Create a new template named "supabase"</li>
                <li>Use the following claims:</li>
              </ol>
              <pre className="bg-muted p-2 rounded-md text-xs mt-2">
{`{
  "sub": "{{user.id}}",
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "email_verified": "{{user.primary_email_address_verification.status}}"
}`}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold">3. Restart Your Application</h3>
              <p>After making these changes, restart your Next.js application to apply the changes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
