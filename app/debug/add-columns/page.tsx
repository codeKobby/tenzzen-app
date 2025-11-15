"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database } from "lucide-react";

export default function AddColumnsPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const addColumns = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/supabase/setup/add-columns");
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast({
          title: "Success",
          description: "Columns added successfully",
          variant: "default",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add columns",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error adding columns:", error);
      toast({
        title: "Error",
        description: "Failed to add columns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Add Missing Columns</CardTitle>
          <CardDescription>
            Add missing columns to the courses table in Supabase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Database Migration</AlertTitle>
              <AlertDescription>
                This will add the missing 'transcript' and 'course_items' columns to the courses table.
                These columns are required for the application to function properly.
              </AlertDescription>
            </Alert>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Add Columns</h3>
              <Button onClick={addColumns} disabled={loading}>
                {loading ? "Adding Columns..." : "Add Columns"}
              </Button>
            </div>

            {loading && <Skeleton className="h-[200px] w-full" />}

            {result && (
              <div className="mt-4 space-y-4">
                <Separator />
                
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    {result.success ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span>Success</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span>Error</span>
                      </>
                    )}
                  </h4>
                  
                  <pre className="bg-muted p-4 rounded-md text-xs mt-2 overflow-auto max-h-[300px]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
