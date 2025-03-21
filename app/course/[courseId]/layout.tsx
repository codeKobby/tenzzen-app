import Link from "next/link";
import { notFound } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  params: {
    courseId: string;
  };
}

export default function CourseLayout({
  children,
  params: { courseId }
}: CourseLayoutProps) {
  // Get course data for navigation
  const course = useQuery(api.courses.getCourse, { id: courseId });

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
            {course.overview.difficultyLevel} · {course.overview.totalDuration}
          </p>
          <div className="flex items-center space-x-4">
            <button className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Icons.help className="mr-2 h-4 w-4" />
              Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}