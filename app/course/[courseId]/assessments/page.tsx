"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SectionAssessmentsList } from "@/components/assessment/section-assessments";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export default function CourseAssessmentsPage() {
  const { courseId } = useParams();
  
  // Get course data
  const course = useQuery(api.courses.getCourse, { 
    id: courseId as string 
  });

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Format sections for the list component
  const sections = course.sections.map(section => ({
    id: section.title, // Using title as ID since that's what we set up
    title: section.title,
    content: section.lessons.map(l => l.content).join('\n')
  }));

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Course Assessments</h1>
        <p className="text-muted-foreground">
          Complete assessments to track your progress through the course.
        </p>
      </div>

      {sections.length > 0 ? (
        <SectionAssessmentsList
          courseId={courseId as string}
          sections={sections}
        />
      ) : (
        <div className="text-center p-8 border rounded-lg bg-muted">
          <p className="text-muted-foreground">
            No sections available in this course yet.
          </p>
        </div>
      )}
    </div>
  );
}