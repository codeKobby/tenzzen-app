"use client";

import { Id } from "@/types/convex-types";
import { useState, useEffect } from "react";
import { AssessmentCard } from "./assessment-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssessmentBase } from "@/types/course";

// TEMPORARY: This is a stub implementation until Supabase assessment functionality is implemented

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
  // Stub implementation - would fetch from Supabase in a real implementation
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<AssessmentBase[]>([]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
      // Return empty array for now - would be replaced with actual Supabase query
      setAssessments([]);
    }, 500);

    return () => clearTimeout(timer);
  }, [courseId, sectionId]);

  if (loading) {
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
          <CardTitle>Assessments Coming Soon</CardTitle>
          <CardDescription>
            Assessment functionality is currently being migrated to Supabase.
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