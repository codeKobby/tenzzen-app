import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CourseSkeleton } from "@/components/ui/skeleton";
import type { CourseGeneratorResult } from "@/tools/courseGenerator";

interface OverviewTabProps {
  course: CourseGeneratorResult;
  loading?: boolean;
}

export function OverviewTab({ course, loading }: OverviewTabProps) {
  if (loading) {
    return <CourseSkeleton />;
  }

  const { overview } = course;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-7">{overview.description}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prerequisites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overview.prerequisites.map((prerequisite, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{prerequisite.title}</h3>
                  <Badge variant={
                    prerequisite.level === "beginner" ? "secondary" :
                    prerequisite.level === "intermediate" ? "default" :
                    "destructive"
                  }>
                    {prerequisite.level}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {prerequisite.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Learning Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {overview.learningOutcomes.map((outcome, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{outcome.title}</h3>
                  <Badge>{outcome.category}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {outcome.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="text-sm font-medium">Duration</h4>
              <p className="text-sm text-muted-foreground">
                {overview.totalDuration}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Difficulty</h4>
              <p className="text-sm text-muted-foreground capitalize">
                {overview.difficultyLevel}
              </p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <h4 className="text-sm font-medium">Required Tools</h4>
              <div className="mt-1 flex flex-wrap gap-1">
                {overview.tools.map((tool, index) => (
                  <Badge key={index} variant="outline">{tool}</Badge>
                ))}
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <div>
            <h4 className="mb-2 text-sm font-medium">Skills You'll Learn</h4>
            <div className="flex flex-wrap gap-1">
              {overview.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">{skill}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}