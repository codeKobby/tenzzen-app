"use client"

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CourseOverviewTab } from "./overview-tab";
import { CourseLessonsTab } from "./lessons-tab";
import { CourseResourcesTab } from "./resources-tab";
import { CourseTestsTab } from "./tests-tab";
import { CourseProgress } from "@/types/ai";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface CourseTabItem {
  id: string;
  label: string;
  icon: React.ComponentType;
}

const COURSE_TABS: CourseTabItem[] = [
  {
    id: "overview",
    label: "Overview",
    icon: () => (
      <svg
        className="h-4 w-4"
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
  },
  {
    id: "lessons",
    label: "Lessons",
    icon: () => (
      <svg
        className="h-4 w-4"
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12 2v20" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: "resources",
    label: "Resources",
    icon: () => (
      <svg
        className="h-4 w-4"
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    id: "tests",
    label: "Tests",
    icon: () => (
      <svg
        className="h-4 w-4"
        fill="none"
        height="24"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width="24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
];

interface CourseTabsProps {
  courseId: string;
  content: any; // Will type properly when implementing individual tabs
}

export function CourseTabs({ courseId, content }: CourseTabsProps) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const storageKey = `course-progress-${courseId}`;
  
  const [progress, setProgress] = useLocalStorage<CourseProgress>(storageKey, {
    completedLessons: [],
    completedTests: [],
    testScores: {},
  });

  const handleLessonComplete = (lessonId: string) => {
    setProgress(prev => ({
      ...prev,
      completedLessons: [...prev.completedLessons, lessonId]
    }));
  };

  const handleTestComplete = (testId: string, score: number) => {
    setProgress(prev => ({
      ...prev,
      completedTests: [...prev.completedTests, testId],
      testScores: { ...prev.testScores, [testId]: score }
    }));
  };

  return (
    <Tabs
      defaultValue="overview"
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full space-y-6"
    >
      <div className="border-b">
        <TabsList className="h-12">
          {COURSE_TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="gap-2 px-4 py-2"
              data-state={activeTab === tab.id ? "active" : "inactive"}
            >
              <tab.icon />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="overview" className="mt-0 border-0 p-0">
        <CourseOverviewTab content={content} />
      </TabsContent>

      <TabsContent value="lessons" className="mt-0 border-0 p-0">
        <CourseLessonsTab
          content={content}
          progress={progress}
          onLessonComplete={handleLessonComplete}
        />
      </TabsContent>

      <TabsContent value="resources" className="mt-0 border-0 p-0">
        <CourseResourcesTab content={content} />
      </TabsContent>

      <TabsContent value="tests" className="mt-0 border-0 p-0">
        <CourseTestsTab
          content={content}
          progress={progress}
          onTestComplete={handleTestComplete}
        />
      </TabsContent>
    </Tabs>
  );
}