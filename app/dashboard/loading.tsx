import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto space-y-8 p-8">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-8 w-[250px]" />
          <Skeleton className="h-4 w-[180px]" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-[120px]" />
          <Skeleton className="h-10 w-10 rounded-md" />
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(null).map((_, i) => (
          <Card key={i} className="border-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-[140px]" />
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid gap-8 lg:grid-cols-7">
        <div className="space-y-8 lg:col-span-4">
          {/* Stats Skeleton */}
          <Card className="border-2">
            <CardHeader>
              <Skeleton className="h-6 w-[180px]" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array(4).fill(null).map((_, i) => (
                  <Skeleton key={i} className="h-[80px] rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Courses Skeleton */}
          <Card className="border-2">
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-[200px]" />
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {Array(2).fill(null).map((_, i) => (
                  <Skeleton key={i} className="h-[200px] rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Graph Skeleton */}
          <Card className="border-2">
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-[150px]" />
              <Skeleton className="h-4 w-[180px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[350px] rounded-lg" />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Skeleton */}
        <div className="space-y-8 lg:col-span-3">
          {/* Schedule Skeleton */}
          <Card className="border-2">
            <CardHeader>
              <Skeleton className="h-6 w-[120px]" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(3).fill(null).map((_, i) => (
                  <Skeleton key={i} className="h-[72px] rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview Skeleton */}
          <Card className="border-2">
            <CardHeader>
              <Skeleton className="h-6 w-[160px]" />
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array(2).fill(null).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-2">
                      <Skeleton className="h-4 w-[100px]" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-6 w-[60px]" />
                      <Skeleton className="mt-1 h-3 w-[100px]" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}