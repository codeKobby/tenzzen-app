'use client';

import { useState } from 'react';
import { Course } from '@/types/course';
import { PanelHeader } from './panel-header';
import { SectionHeader } from './section-header';
import { ScrollArea } from '../ui/scroll-area';
import { Card } from '../ui/card';
import { Separator } from '../ui/separator';
import { cn } from '@/lib/utils';

interface CourseDisplayProps {
  course?: Course;
  isLoading?: boolean;
  error?: string;
}

export function CourseDisplay({ course, isLoading, error }: CourseDisplayProps) {
  const [selectedSection, setSelectedSection] = useState(0);

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-4">
          <p className="text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  if (isLoading || !course?.sections) {
    return (
      <div className="p-6">
        <Card className="p-4">
          <p className="text-muted-foreground">
            {isLoading ? 'Analyzing video content...' : 'No course data available'}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <ScrollArea className="h-screen">
      <div className="space-y-6 p-6">
        <PanelHeader 
          title={course.title}
          subtitle={course.subtitle}
          metadata={[
            {
              icon: <span>📚</span>,
              text: `${course.sections.length} sections`
            },
            {
              icon: <span>⏱️</span>,
              text: course.overview.totalDuration
            },
            {
              icon: <span>📊</span>,
              text: course.overview.difficultyLevel
            }
          ]}
        />

        <Separator className="my-6" />

        <div className="space-y-8">
          {course.sections.map((section, index) => (
            <div key={index} className="space-y-4">
              <SectionHeader
                title={section.title}
                description={section.description}
                metadata={`${section.lessons.length} lessons • ${section.duration}`}
              />

              <div className="grid gap-4">
                {section.lessons.map((lesson, lessonIndex) => (
                  <Card
                    key={lessonIndex}
                    className={cn(
                      "p-4",
                      selectedSection === index && "border-primary"
                    )}
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium">{lesson.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {lesson.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
