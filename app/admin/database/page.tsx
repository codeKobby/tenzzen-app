'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, AlertCircle, Database, ArrowRight, RefreshCw, FileText } from 'lucide-react'
import { toast } from '@/components/custom-toast'
import Link from 'next/link'

export default function DatabaseAdminPage() {
  const [isApplyingImprovements, setIsApplyingImprovements] = useState(false)
  const [isApplyingMigration, setIsApplyingMigration] = useState(false)
  const [improvementsResults, setImprovementsResults] = useState<any>(null)
  const [migrationResults, setMigrationResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('structure')

  const applyDatabaseImprovements = async () => {
    try {
      setIsApplyingImprovements(true)
      
      const response = await fetch('/api/supabase/setup/db-improvements', {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to apply database improvements')
      }
      
      const data = await response.json()
      setImprovementsResults(data)
      
      toast.success('Database improvements applied', {
        description: data.message
      })
    } catch (error) {
      console.error('Error applying database improvements:', error)
      toast.error('Failed to apply database improvements', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsApplyingImprovements(false)
    }
  }

  const applyDataMigration = async () => {
    try {
      setIsApplyingMigration(true)
      
      const response = await fetch('/api/supabase/setup/db-migration', {
        method: 'POST',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to apply data migration')
      }
      
      const data = await response.json()
      setMigrationResults(data)
      
      toast.success('Data migration applied', {
        description: data.message
      })
    } catch (error) {
      console.error('Error applying data migration:', error)
      toast.error('Failed to apply data migration', {
        description: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsApplyingMigration(false)
    }
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Database Administration</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="structure">Database Structure</TabsTrigger>
          <TabsTrigger value="migration">Data Migration</TabsTrigger>
          <TabsTrigger value="documentation">Documentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="structure">
          <Card>
            <CardHeader>
              <CardTitle>Database Structure Improvements</CardTitle>
              <CardDescription>
                Apply structural improvements to the database to implement a fully normalized structure
                following industry standards for learning platforms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Database className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  This operation will enhance the database structure with additional tables and relationships.
                  It will not delete any existing data. This is a safe operation that can be run multiple times.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Improvements Include:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Enhanced video metadata storage</li>
                  <li>Detailed lesson progress tracking</li>
                  <li>User notes functionality</li>
                  <li>Course resources and assessments</li>
                  <li>Automatic enrollment management</li>
                  <li>User statistics tracking</li>
                </ul>
              </div>
              
              {improvementsResults && (
                <div className="mt-6 space-y-4">
                  <Separator />
                  <h3 className="text-lg font-medium">Results:</h3>
                  <p>{improvementsResults.message}</p>
                  
                  <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                    {improvementsResults.results.map((result: any, index: number) => (
                      <div key={index} className="flex items-start gap-2 mb-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{result.statement}</p>
                          {!result.success && (
                            <p className="text-sm text-red-500">{result.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={applyDatabaseImprovements} 
                disabled={isApplyingImprovements}
                className="gap-2"
              >
                {isApplyingImprovements ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Database className="h-4 w-4" />
                )}
                Apply Database Improvements
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="migration">
          <Card>
            <CardHeader>
              <CardTitle>Data Migration</CardTitle>
              <CardDescription>
                Migrate existing data from the current structure to the new normalized structure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Database className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  This operation will migrate data from the existing structure to the new normalized tables.
                  It will not delete any existing data. This is a safe operation that can be run multiple times.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Migration Steps:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Migrate categories from courses.category field</li>
                  <li>Migrate tags from courses.tags array</li>
                  <li>Migrate course sections and lessons from course_items JSONB</li>
                  <li>Migrate video data to videos table</li>
                  <li>Create initial lesson progress records for existing enrollments</li>
                </ul>
              </div>
              
              {migrationResults && (
                <div className="mt-6 space-y-4">
                  <Separator />
                  <h3 className="text-lg font-medium">Results:</h3>
                  <p>{migrationResults.message}</p>
                  
                  <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                    {migrationResults.results.map((result: any, index: number) => (
                      <div key={index} className="flex items-start gap-2 mb-2">
                        {result.success ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{result.step}</p>
                          {!result.success && (
                            <p className="text-sm text-red-500">{result.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={applyDataMigration} 
                disabled={isApplyingMigration}
                className="gap-2"
              >
                {isApplyingMigration ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Apply Data Migration
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="documentation">
          <Card>
            <CardHeader>
              <CardTitle>Database Documentation</CardTitle>
              <CardDescription>
                View the documentation for the database structure and data flows.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p>
                  The database structure is documented in the following files:
                </p>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li>
                    <Link href="/docs/DATABASE_STRUCTURE.md" target="_blank" className="text-blue-500 hover:underline flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Database Structure
                    </Link>
                  </li>
                  <li>
                    <Link href="/docs/DATABASE_AND_FLOWS.md" target="_blank" className="text-blue-500 hover:underline flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Database and Flows
                    </Link>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
