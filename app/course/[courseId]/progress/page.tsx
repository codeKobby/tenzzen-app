"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Icons } from "@/components/ui/icons";

export default function CourseProgressPage() {
  const { courseId } = useParams();
  
  // Get course and progress data
  const course = useQuery(api.courses.getCourse, { 
    id: courseId as string 
  });

  const progress = useQuery(api.progress.getCourseProgress, {
    courseId: courseId as string
  });

  if (!course || !progress) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate section progress
  const sectionProgress = course.sections.map(section => {
    const sectionAssessments = progress.filter(p => 
      section.assessments.some(a => a.id === p.assessmentId)
    );

    const completed = sectionAssessments.filter(p => 
      p.status === "completed" || p.status === "graded"
    ).length;

    const total = section.assessments.length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;

    return {
      title: section.title,
      completed,
      total,
      percentage
    };
  });

  // Calculate overall progress
  const totalCompleted = progress.filter(p => 
    p.status === "completed" || p.status === "graded"
  ).length;
  const totalAssessments = course.sections.reduce(
    (sum, section) => sum + section.assessments.length, 
    0
  );
  const overallPercentage = totalAssessments > 0 
    ? (totalCompleted / totalAssessments) * 100 
    : 0;

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
          <CardDescription>
            {totalCompleted} of {totalAssessments} assessments completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={overallPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Section Progress */}
      <div className="grid gap-6">
        {sectionProgress.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              <CardDescription>
                {section.completed} of {section.total} assessments completed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Progress value={section.percentage} className="h-2" />
              
              {/* Assessment List */}
              <div className="space-y-2">
                {course.sections[index].assessments.map((assessment) => {
                  const assessmentProgress = progress.find(p => 
                    p.assessmentId === assessment.id
                  );

                  return (
                    <div 
                      key={assessment.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center space-x-2">
                        {assessment.type === "test" && (
                          <Icons.clipboard className="h-4 w-4 text-muted-foreground" />
                        )}
                        {assessment.type === "assignment" && (
                          <Icons.edit className="h-4 w-4 text-muted-foreground" />
                        )}
                        {assessment.type === "project" && (
                          <Icons.rocket className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">
                          {assessment.title}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {assessmentProgress?.status === "completed" && (
                          <Icons.check className="h-4 w-4 text-green-500" />
                        )}
                        {assessmentProgress?.status === "graded" && 
                          assessmentProgress.score !== undefined && (
                          <span className="text-sm text-muted-foreground">
                            {assessmentProgress.score}%
                          </span>
                        )}
                        {assessmentProgress?.status === "in_progress" && (
                          <Icons.clock className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}