"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Spinner from "../components/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useSupabase } from "@/contexts/supabase-context";

export default function MigrationsPage() {
    const [isRunningMigration, setIsRunningMigration] = useState(false);
    const [migrationResult, setMigrationResult] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("migrations");
    const [error, setError] = useState<string | null>(null);
    const supabase = useSupabase();
    
    // Migration status
    const [migrations, setMigrations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        async function fetchMigrations() {
            try {
                const { data, error } = await supabase
                    .from('migrations')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (error) {
                    console.error("Error fetching migrations:", error);
                    return;
                }
                
                setMigrations(data || []);
            } catch (err) {
                console.error("Error fetching migrations:", err);
            } finally {
                setLoading(false);
            }
        }
        
        fetchMigrations();
    }, [supabase]);

    const handleRunMigration = async () => {
        setIsRunningMigration(true);
        setError(null);
        try {
            // This would be implemented with a Supabase function or API endpoint
            setMigrationResult({
                message: "Migration functionality has been moved to Supabase",
                status: "info"
            });
        } catch (err) {
            console.error("Migration error:", err);
            setError(err instanceof Error ? err.message : "Unknown error occurred");
        } finally {
            setIsRunningMigration(false);
        }
    };

    return (
        <div className="container py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Database Migrations</h1>
                <p className="text-muted-foreground">
                    Manage database migrations and schema updates
                </p>
            </div>

            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="migrations">Migrations</TabsTrigger>
                </TabsList>

                <TabsContent value="migrations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Migration Status</CardTitle>
                            <CardDescription>
                                View and run database migrations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Information</AlertTitle>
                                    <AlertDescription>
                                        Migration functionality has been moved to Supabase. Database migrations are now managed through Supabase migrations.
                                    </AlertDescription>
                                </Alert>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Migration History</h3>
                                </div>

                                {loading ? (
                                    <div className="flex justify-center p-4">
                                        <Spinner />
                                    </div>
                                ) : migrations.length > 0 ? (
                                    <ScrollArea className="h-[300px] rounded-md border">
                                        <div className="p-4 space-y-2">
                                            {migrations.map((migration) => (
                                                <div
                                                    key={migration.id}
                                                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                                >
                                                    <div>
                                                        <div className="font-medium">{migration.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {new Date(migration.created_at).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <Badge variant="outline">
                                                        {migration.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                ) : (
                                    <div className="text-center p-4 border rounded-lg">
                                        <p className="text-muted-foreground">No migrations found</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                onClick={handleRunMigration}
                                disabled={isRunningMigration}
                            >
                                {isRunningMigration && <Spinner className="mr-2" />}
                                Run Migrations
                            </Button>
                        </CardFooter>
                    </Card>

                    {migrationResult && (
                        <Alert variant={migrationResult.status === "success" ? "default" : "destructive"}>
                            {migrationResult.status === "success" ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : migrationResult.status === "info" ? (
                                <AlertCircle className="h-4 w-4" />
                            ) : (
                                <AlertTriangle className="h-4 w-4" />
                            )}
                            <AlertTitle>
                                {migrationResult.status === "success"
                                    ? "Success"
                                    : migrationResult.status === "info"
                                    ? "Information"
                                    : "Error"}
                            </AlertTitle>
                            <AlertDescription>
                                {migrationResult.message}
                            </AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
