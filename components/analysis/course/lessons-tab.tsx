import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseSkeleton } from "@/components/ui/skeleton";
import type { CourseGeneratorResult } from "@/tools/courseGenerator";
import { Button } from "@/components/ui/button";
import { Lock, Timer } from "lucide-react";

interface LessonsTabProps {
  course: CourseGeneratorResult;
  loading?: boolean;
}

type Lesson = CourseGeneratorResult['sections'][0]['lessons'][0];
type Section = CourseGeneratorResult['sections'][0];

export function LessonsTab({ course, loading }: LessonsTabProps) {
  if (loading) {
    return <CourseSkeleton />;
  }

  return (
    <div className="space-y-6">
      {course.sections.map((section: Section, sectionIndex: number) => (
        <Card key={section.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {sectionIndex + 1}. {section.title}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">{section.duration}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {section.lessons.map((lesson: Lesson, lessonIndex: number) => (
              <div 
                key={lesson.id}
                className="flex items-start justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">
                      {sectionIndex + 1}.{lessonIndex + 1} {lesson.title}
                    </h4>
                    {lesson.isLocked && (
                      <Badge variant="outline">
                        <Lock className="mr-1 h-3 w-3" />
                        Locked
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{lesson.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{lesson.duration}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" disabled={lesson.isLocked}>
                  {lesson.isLocked ? "Unlock" : "Start"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}