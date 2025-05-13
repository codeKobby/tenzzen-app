'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export function MigrateDataButton() {
  const [isMigratingUsers, setIsMigratingUsers] = useState(false);
  const [userMigrationResult, setUserMigrationResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('users');
  
  const handleMigrateUsers = async () => {
    if (!confirm('Are you sure you want to migrate all users to Supabase? This may take a while.')) {
      return;
    }
    
    setIsMigratingUsers(true);
    setUserMigrationResult(null);
    
    try {
      const response = await fetch('/api/migrate-users', { method: 'POST' });
      const result = await response.json();
      setUserMigrationResult(result);
    } catch (error) {
      console.error('Error migrating users:', error);
      setUserMigrationResult({ success: false, error: 'Failed to migrate users' });
    } finally {
      setIsMigratingUsers(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Migration Tool</CardTitle>
        <CardDescription>
          Migrate data from Convex to Supabase. This process may take some time depending on the amount of data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">User Data Migration</h3>
              <p className="text-sm text-muted-foreground">
                This will migrate all user data, profiles, and stats from Convex to Supabase.
              </p>
              
              {userMigrationResult && (
                <div className={`p-4 rounded-md ${userMigrationResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {userMigrationResult.success ? (
                    <p>Successfully migrated {userMigrationResult.count} users to Supabase.</p>
                  ) : (
                    <p>Error: {userMigrationResult.error}</p>
                  )}
                </div>
              )}
              
              {isMigratingUsers && (
                <div className="space-y-2 py-2">
                  <Progress value={45} className="h-2" />
                  <p className="text-sm text-muted-foreground">Migrating users...</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="courses" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Course Data Migration</h3>
              <p className="text-sm text-muted-foreground">
                This will migrate all courses, enrollments, and related data from Convex to Supabase.
              </p>
              <p className="text-sm font-medium text-amber-600">
                Coming soon - First complete user migration.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="videos" className="space-y-4 mt-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Video Data Migration</h3>
              <p className="text-sm text-muted-foreground">
                This will migrate all videos, transcripts, and related data from Convex to Supabase.
              </p>
              <p className="text-sm font-medium text-amber-600">
                Coming soon - First complete user and course migration.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
        
        {activeTab === 'users' && (
          <Button 
            onClick={handleMigrateUsers} 
            disabled={isMigratingUsers}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isMigratingUsers ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Migrating Users...
              </>
            ) : (
              'Migrate Users to Supabase'
            )}
          </Button>
        )}
        
        {activeTab === 'courses' && (
          <Button disabled className="bg-blue-600 hover:bg-blue-700">
            Migrate Courses (Coming Soon)
          </Button>
        )}
        
        {activeTab === 'videos' && (
          <Button disabled className="bg-blue-600 hover:bg-blue-700">
            Migrate Videos (Coming Soon)
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
