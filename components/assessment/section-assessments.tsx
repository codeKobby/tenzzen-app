"use client";

import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AssessmentCard } from "./assessment-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssessmentBase } from "@/types/course";

interface SectionAssessmentsProps {
  courseId: Id<"courses">;
  sectionId: string;
  sectionContent: string;
}

export function SectionAssessments({
  courseId,
  sectionId,
  sectionContent
}: SectionAssessmentsProps) {
  const assessments = useQuery(api.assessments.getSectionAssessments, {
    courseId,
    sectionId
  });

  if (assessments === undefined) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (assessments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Assessments</CardTitle>
          <CardDescription>
            There are no assessments available for this section yet.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {assessments.map((assessment: AssessmentBase) => (
        <AssessmentCard
          key={assessment.id}
          courseId={courseId}
          sectionId={sectionId}
          assessmentId={assessment.id}
          title={assessment.title}
          description={assessment.description}
          type={assessment.type}
          context={sectionContent}
          assessment={assessment}
        />
      ))}
    </div>
  );
}

interface SectionAssessmentsListProps {
  courseId: Id<"courses">;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    assessments: AssessmentBase[];
  }>;
}

export function SectionAssessmentsList({
  courseId,
  sections
}: SectionAssessmentsListProps) {
  if (sections.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Sections</CardTitle>
          <CardDescription>
            This course has no sections with assessments yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once sections are added, their assessments will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.id} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionAssessments
                courseId={courseId}
                sectionId={section.id}
                sectionContent={section.content}
              />
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}