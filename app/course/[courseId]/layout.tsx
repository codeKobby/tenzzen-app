"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { useState, useEffect, use } from "react";
import { useSupabase } from "@/contexts/supabase-context";
import { Icons } from "@/components/ui/icons";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

const tabs = [
  {
    title: "Overview",
    href: "",
    icon: Icons.laptop
  },
  {
    title: "Content",
    href: "/content",
    icon: Icons.fileText
  },
  {
    title: "Assessments",
    href: "/assessments",
    icon: Icons.clipboard
  },
  {
    title: "Progress",
    href: "/progress",
    icon: Icons.chart
  }
];

interface CourseLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    courseId: string;
  }>;
}

export default function CourseLayout({
  children,
  params
}: CourseLayoutProps) {
  const { courseId } = use(params);
  const supabase = useSupabase();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch course data from Supabase
  useEffect(() => {
    async function fetchCourse() {
      try {
        console.log('Fetching course with ID:', courseId);

        // Check if courseId is valid
        if (!courseId) {
          console.error('Error fetching course: Invalid courseId');
          setLoading(false);
          return;
        }

        // Add error handling for Supabase connection
        if (!supabase) {
          console.error('Error fetching course: Supabase client not initialized');
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error) {
          console.error('Error fetching course:', {
            code: error.code,
            message: error.message,
            details: error.details
          });
          setLoading(false);
          return;
        }

        if (!data) {
          console.error('No course found with ID:', courseId);
          setLoading(false);
          return;
        }

        console.log('Course fetched successfully:', data.id);
        setCourse(data);
      } catch (err) {
        // Improved error logging
        if (err instanceof Error) {
          console.error('Error fetching course:', {
            message: err.message,
            stack: err.stack
          });
        } else {
          console.error('Error fetching course:', err);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCourse();
  }, [courseId, supabase]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!course) {
    return notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Course Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="flex items-center space-x-4">
            <Link
              href="/courses"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              <Icons.chevronLeft className="mr-2 h-4 w-4" />
              Back to Courses
            </Link>
            <span className="font-semibold">{course.title}</span>
          </div>
        </div>
      </header>

      {/* Course Navigation */}
      <div className="container border-b py-4">
        <nav className="flex space-x-6">
          {tabs.map((tab) => {
            const href = `/course/${courseId}${tab.href}`;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-foreground/80",
                  "text-foreground/60"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Course Footer */}
      <footer className="border-t py-6">
        <div className="container flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {course.difficulty_level || 'Beginner'} · {course.estimated_duration || '1 hour'}
          </p>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Icons.help className="mr-2 h-4 w-4" />
              Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}