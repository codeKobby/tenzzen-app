"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SectionAssessmentsList } from "@/components/assessment/section-assessments";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// TEMPORARY: This is a stub implementation until Supabase assessment functionality is implemented

export default function CourseAssessmentsPage() {
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold">Course Assessments</h1>
        <p className="text-muted-foreground">
          Complete assessments to track your progress through the course.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assessments Coming Soon</CardTitle>
          <CardDescription>
            Assessment functionality is currently being migrated to Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We're working on bringing a better assessment experience to you. Check back soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}