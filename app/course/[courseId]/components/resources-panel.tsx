"use client"

import { ExternalLink, FileText, Link2, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Resource {
  id?: string
  title: string
  description?: string
  url: string
  type?: string
}

interface ResourcesPanelProps {
  resources: Resource[]
}

export function ResourcesPanel({ resources }: ResourcesPanelProps) {
  // Get resource icon based on type
  const getResourceIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'document':
      case 'pdf':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'link':
      case 'url':
        return <Link2 className="h-5 w-5 text-green-500" />
      default:
        return <ExternalLink className="h-5 w-5 text-primary" />
    }
  }

  return (
    <div className="border rounded-md p-4 min-h-[400px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium">Additional Resources</h3>
      </div>

      {resources.length > 0 ? (
        <div className="grid gap-3">
          {resources.map((resource, index) => (
            <Card key={resource.id || `resource-${index}`}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getResourceIcon(resource.type)}
                  </div>
                  <div>
                    <h4 className="font-medium">{resource.title}</h4>
                    {resource.description && (
                      <p className="text-xs text-muted-foreground mt-1">{resource.description}</p>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[300px] text-center">
          <Lightbulb className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium mb-1">No Resources Available</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            There are no additional resources for this lesson. Check back later or explore other lessons for more learning materials.
          </p>
        </div>
      )}
    </div>
  )
}
