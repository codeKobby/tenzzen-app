"use client";

import { useState, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Spinner from "../components/spinner";
import { api } from "@/convex/_generated/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function MigrationsPage() {
    const [isRunningMigration, setIsRunningMigration] = useState(false);
    const [migrationResult, setMigrationResult] = useState<any>(null);
    const [selectedMigrationId, setSelectedMigrationId] = useState<string | null>(null);

    // Get applied migrations from the database
    const appliedMigrations = useQuery(api.migration_framework.getAppliedMigrations) || [];

    // Get current schema version
    const currentSchemaVersion = useQuery(api.migration_framework.getCurrentSchemaVersion) || 0;

    // Run all pending migrations
    const runPendingMigrations = useAction(api.migration_utils.runPendingMigrations);

    // Run a specific migration
    const runSpecificMigration = useAction(api.migration_utils.runSpecificMigration);

    // Define the available migrations from the migrations.ts file
    // In a real implementation, you could fetch this from the server
    const availableMigrations = useQuery(api.admin.getAvailableMigrations) || [];

    // Calculate pending migrations
    const pendingMigrations = availableMigrations.filter(
        migration => !appliedMigrations.some(applied => applied.migrationId === migration.id)
    );

    const handleRunPendingMigrations = async () => {
        setIsRunningMigration(true);
        setMigrationResult(null);

        try {
            const result = await runPendingMigrations({});
            setMigrationResult(result);
        } catch (error) {
            setMigrationResult({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            });
        } finally {
            setIsRunningMigration(false);
        }
    };

    const handleRunSpecificMigration = async (migrationId: string) => {
        setIsRunningMigration(true);
        setMigrationResult(null);
        setSelectedMigrationId(migrationId);

        try {
            const result = await runSpecificMigration({ migrationId });
            setMigrationResult(result);
        } catch (error) {
            setMigrationResult({
                success: false,
                error: error instanceof Error ? error.message : "Unknown error"
            });
        } finally {
            setIsRunningMigration(false);
            setSelectedMigrationId(null);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Database Migrations</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and track database schema migrations
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-sm py-1">
                        Schema Version: {currentSchemaVersion}
                    </Badge>
                </div>
            </div>

            {migrationResult && (
                <Alert
                    variant={migrationResult.success ? "default" : "destructive"}
                    className="mb-6"
                >
                    {migrationResult.success ? (
                        <CheckCircle className="h-4 w-4" />
                    ) : (
                        <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertTitle>
                        {migrationResult.success ? "Success" : "Error"}
                    </AlertTitle>
                    <AlertDescription>
                        {migrationResult.message || migrationResult.error ||
                            (migrationResult.success
                                ? `Successfully ran migrations. ${migrationResult.migrationsRun} migrations applied.`
                                : "Failed to run migrations.")}
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Tabs defaultValue="pending">
                        <TabsList className="mb-4">
                            <TabsTrigger value="pending">
                                Pending Migrations
                                <Badge variant="secondary" className="ml-2">{pendingMigrations.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="applied">
                                Applied Migrations
                                <Badge variant="secondary" className="ml-2">{appliedMigrations.length}</Badge>
                            </TabsTrigger>
                            <TabsTrigger value="all">All Migrations</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Pending Migrations</CardTitle>
                                    <CardDescription>
                                        These migrations have not yet been applied to the database
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[400px]">
                                        {pendingMigrations.length === 0 ? (
                                            <div className="text-center p-4 text-muted-foreground">
                                                No pending migrations. Your database is up to date!
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {pendingMigrations.map(migration => (
                                                    <div
                                                        key={migration.id}
                                                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                                                    >
                                                        <div className="flex justify-between">
                                                            <div className="font-medium">{migration.name}</div>
                                                            <Badge variant="outline">v{migration.version}</Badge>
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {migration.description}
                                                        </p>
                                                        <div className="mt-4 flex justify-between items-center">
                                                            <div className="text-xs text-muted-foreground">
                                                                ID: {migration.id}
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleRunSpecificMigration(migration.id)}
                                                                disabled={isRunningMigration}
                                                            >
                                                                {isRunningMigration && selectedMigrationId === migration.id ? (
                                                                    <>
                                                                        <Spinner className="mr-2 h-4 w-4" />
                                                                        Running...
                                                                    </>
                                                                ) : (
                                                                    "Run Migration"
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        onClick={handleRunPendingMigrations}
                                        disabled={isRunningMigration || pendingMigrations.length === 0}
                                        className="w-full"
                                    >
                                        {isRunningMigration ? (
                                            <>
                                                <Spinner className="mr-2 h-4 w-4" />
                                                Running Migrations...
                                            </>
                                        ) : (
                                            `Run All Pending Migrations${pendingMigrations.length > 0 ? ` (${pendingMigrations.length})` : ''}`
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="applied">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Applied Migrations</CardTitle>
                                    <CardDescription>
                                        These migrations have already been applied to the database
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[400px]">
                                        {appliedMigrations.length === 0 ? (
                                            <div className="text-center p-4 text-muted-foreground">
                                                No migrations have been applied yet.
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {[...appliedMigrations]
                                                    .sort((a, b) => b.appliedAt - a.appliedAt) // Sort by newest first
                                                    .map(migration => (
                                                        <div
                                                            key={migration.migrationId}
                                                            className="border rounded-lg p-4"
                                                        >
                                                            <div className="flex justify-between">
                                                                <div className="font-medium">{migration.name}</div>
                                                                <Badge variant="outline">v{migration.version}</Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {migration.description}
                                                            </p>
                                                            <div className="mt-4 flex justify-between items-center">
                                                                <div className="text-xs text-muted-foreground">
                                                                    Applied: {new Date(migration.appliedAt).toLocaleString()}
                                                                </div>
                                                                <Badge variant="success" className="bg-green-100 text-green-800">
                                                                    <CheckCircle className="mr-1 h-3 w-3" /> Applied
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="all">
                            <Card>
                                <CardHeader>
                                    <CardTitle>All Migrations</CardTitle>
                                    <CardDescription>
                                        Complete list of all migrations (applied and pending)
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[400px]">
                                        {availableMigrations.length === 0 ? (
                                            <div className="text-center p-4 text-muted-foreground">
                                                No migrations found.
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {[...availableMigrations]
                                                    .sort((a, b) => b.version - a.version) // Sort by version (newest first)
                                                    .map(migration => {
                                                        const isApplied = appliedMigrations.some(
                                                            applied => applied.migrationId === migration.id
                                                        );
                                                        const appliedMigration = appliedMigrations.find(
                                                            applied => applied.migrationId === migration.id
                                                        );

                                                        return (
                                                            <div
                                                                key={migration.id}
                                                                className={`border rounded-lg p-4 ${isApplied ? 'bg-green-50 dark:bg-green-950/20' : ''}`}
                                                            >
                                                                <div className="flex justify-between">
                                                                    <div className="font-medium">{migration.name}</div>
                                                                    <Badge variant="outline">v{migration.version}</Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {migration.description}
                                                                </p>
                                                                <div className="mt-4 flex justify-between items-center">
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {isApplied
                                                                            ? `Applied: ${new Date(appliedMigration!.appliedAt).toLocaleString()}`
                                                                            : `ID: ${migration.id}`
                                                                        }
                                                                    </div>
                                                                    {isApplied ? (
                                                                        <Badge variant="success" className="bg-green-100 text-green-800">
                                                                            <CheckCircle className="mr-1 h-3 w-3" /> Applied
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-amber-800">
                                                                            <Clock className="mr-1 h-3 w-3" /> Pending
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Migration Info</CardTitle>
                            <CardDescription>
                                About the migration system
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-semibold mb-1">Current Schema Version</h3>
                                <p className="text-sm text-muted-foreground">
                                    Current database schema is at version {currentSchemaVersion}.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-1">Pending Migrations</h3>
                                <p className="text-sm text-muted-foreground">
                                    There {pendingMigrations.length === 1 ? 'is' : 'are'} {pendingMigrations.length} pending migration{pendingMigrations.length !== 1 ? 's' : ''}.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-1">Applied Migrations</h3>
                                <p className="text-sm text-muted-foreground">
                                    {appliedMigrations.length} migration{appliedMigrations.length !== 1 ? 's have' : ' has'} been applied.
                                </p>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="font-semibold mb-1">How Migrations Work</h3>
                                <p className="text-sm text-muted-foreground">
                                    Migrations are run in order based on version number. Dependencies between migrations
                                    are respected, and the system ensures each migration is applied only once.
                                </p>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-1">Running Migrations</h3>
                                <p className="text-sm text-muted-foreground">
                                    You can run all pending migrations at once or choose to run specific migrations
                                    individually. Failed migrations can be retried after fixing the underlying issues.
                                </p>
                            </div>

                            <Alert variant="warning" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Migration Safety</AlertTitle>
                                <AlertDescription className="text-xs">
                                    Always backup your database before running migrations in production.
                                    Test migrations in development or staging environments first.
                                </AlertDescription>
                            </Alert>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" onClick={() => window.location.href = "/docs/database/migration-guide.md"} className="w-full">
                                View Migration Documentation
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}