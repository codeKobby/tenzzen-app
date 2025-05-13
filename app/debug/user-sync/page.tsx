"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

export default function UserSyncDebugPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const testUserSync = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/user-sync");
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast({
          title: "User sync test completed",
          description: data.supabase.userAfterSync ? "User successfully synced to Supabase" : "User sync failed",
          variant: data.supabase.userAfterSync ? "default" : "destructive",
        });
      } else {
        toast({
          title: "User sync test failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error testing user sync:", error);
      toast({
        title: "Error",
        description: "Failed to test user sync",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Automatically run the test when the page loads
    if (isLoaded && isSignedIn) {
      testUserSync();
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>User Sync Debug</CardTitle>
            <CardDescription>Loading authentication status...</CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[200px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>User Sync Debug</CardTitle>
            <CardDescription>You must be signed in to use this page</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>User Sync Debug</CardTitle>
          <CardDescription>
            Test the synchronization between Clerk and Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Clerk User</h3>
              <p>ID: {user?.id}</p>
              <p>Email: {user?.primaryEmailAddress?.emailAddress}</p>
              <p>Name: {user?.fullName}</p>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Supabase Sync Status</h3>
              <Button onClick={testUserSync} disabled={loading}>
                {loading ? "Testing..." : "Test Sync"}
              </Button>
            </div>

            {loading && <Skeleton className="h-[200px] w-full" />}

            {result && !loading && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">JWT Status</h4>
                  <p>Available: {result.jwt.available ? "Yes" : "No"}</p>
                  {result.jwt.payload && (
                    <pre className="bg-muted p-2 rounded text-xs mt-2 overflow-auto">
                      {JSON.stringify(result.jwt.payload, null, 2)}
                    </pre>
                  )}
                </div>

                <div>
                  <h4 className="font-medium">Supabase Status</h4>
                  <p>Table Exists: {result.supabase.tableExists ? "Yes" : "No"}</p>
                  <p>
                    User Before Sync:{" "}
                    {result.supabase.userBeforeSync ? "Found" : "Not Found"}
                  </p>
                  <p>
                    User After Sync:{" "}
                    {result.supabase.userAfterSync ? "Found" : "Not Found"}
                  </p>
                  <p>Sync Result: {result.supabase.syncResult ? "Success" : "Failed"}</p>

                  {result.supabase.userAfterSync && (
                    <pre className="bg-muted p-2 rounded text-xs mt-2 overflow-auto">
                      {JSON.stringify(result.supabase.userAfterSync, null, 2)}
                    </pre>
                  )}
                </div>

                {(result.errors.tableError || 
                  result.errors.userError || 
                  result.errors.afterSyncError) && (
                  <div>
                    <h4 className="font-medium text-destructive">Errors</h4>
                    {result.errors.tableError && (
                      <p>Table Error: {result.errors.tableError.message} ({result.errors.tableError.code})</p>
                    )}
                    {result.errors.userError && (
                      <p>User Error: {result.errors.userError.message} ({result.errors.userError.code})</p>
                    )}
                    {result.errors.afterSyncError && (
                      <p>After Sync Error: {result.errors.afterSyncError.message} ({result.errors.afterSyncError.code})</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
