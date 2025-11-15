import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CourseSkeleton } from "@/components/ui/skeleton";
import type { CourseGeneratorResult } from "@/tools/courseGenerator";
import { Button } from "@/components/ui/button";
import { Timer, Lock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestsTabProps {
  course: CourseGeneratorResult;
  loading?: boolean;
}

type Section = CourseGeneratorResult['sections'][0];
type Lesson = Section['lessons'][0];
type Test = Lesson['test'];
type Question = Test['questions'][0];

interface EnhancedTest extends Test {
  section: string;
  lesson: string;
}

export function TestsTab({ course, loading }: TestsTabProps) {
  if (loading) {
    return <CourseSkeleton />;
  }

  // Collect all tests from all sections and lessons
  const allTests = React.useMemo(() => {
    if (!course || !course.sections) return [] as EnhancedTest[];

    return course.sections.flatMap((section: Section) =>
      section.lessons
        .filter((lesson: Lesson) => lesson.test)
        .map((lesson: Lesson) => ({
          ...lesson.test,
          section: section.title,
          lesson: lesson.title
        }))
    ) as EnhancedTest[];
  }, [course, course?.sections]);

  // Early return if no tests
  if (allTests.length === 0) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border">
        <p className="text-sm text-muted-foreground">No tests available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allTests.map((test) => (
        <Card key={`${test.section}-${test.lesson}-${test.id}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>{test.title}</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {test.description}
                </div>
              </div>
              {test.isLocked && (
                <Badge variant="outline" className="gap-1">
                  <Lock className="h-3 w-3" />
                  Locked
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary">{test.section}</Badge>
              <Badge variant="outline">{test.lesson}</Badge>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>{test.timeLimit} minutes</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                <span>Pass: {test.passingScore}%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {test.questions.map((question: Question, index: number) => (
                <div key={index} className={cn(
                  "rounded-lg border p-4",
                  test.isLocked && "opacity-50"
                )}>
                  <div className="mb-4 font-medium">
                    {index + 1}. {question.question}
                  </div>
                  <div className="space-y-2">
                    {question.options.map((option: string, optionIndex: number) => (
                      <div key={optionIndex} className={cn(
                        "flex items-center rounded-md border p-3",
                        optionIndex === question.correctAnswer && !test.isLocked &&
                        "border-green-500/20 bg-green-500/10"
                      )}>
                        <div className="flex-1">{option}</div>
                        {optionIndex === question.correctAnswer && !test.isLocked && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                    ))}
                  </div>
                  {!test.isLocked && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {question.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button disabled={test.isLocked}>
                {test.isLocked ? "Unlock Test" : "Start Test"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}