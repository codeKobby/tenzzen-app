"use client"

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CourseGenerationResult } from '@/types/ai';
import { 
  Clock, 
  Target, 
  Blocks, 
  GraduationCap,
  Settings,
  CheckCircle2
} from 'lucide-react';

interface CourseOverviewTabProps {
  content: CourseGenerationResult;
}

export function CourseOverviewTab({ content }: CourseOverviewTabProps) {
  const { overview } = content;

  return (
    <ScrollArea className="h-full pr-4">
      <div className="space-y-8">
        {/* Course Description */}
        <section>
          <h3 className="text-lg font-semibold mb-3">About This Course</h3>
          <p className="text-muted-foreground whitespace-pre-wrap">{overview.description}</p>
        </section>

        {/* Quick Info */}
        <section className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center space-x-3 bg-secondary/50 p-3 rounded-lg">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <h4 className="text-sm font-medium">Duration</h4>
              <p className="text-sm text-muted-foreground">{overview.totalDuration}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-secondary/50 p-3 rounded-lg">
            <Target className="h-5 w-5 text-primary" />
            <div>
              <h4 className="text-sm font-medium">Difficulty</h4>
              <p className="text-sm text-muted-foreground capitalize">{overview.difficultyLevel}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 bg-secondary/50 p-3 rounded-lg">
            <Blocks className="h-5 w-5 text-primary" />
            <div>
              <h4 className="text-sm font-medium">Modules</h4>
              <p className="text-sm text-muted-foreground">{content.sections.length} sections</p>
            </div>
          </div>
        </section>

        {/* Learning Outcomes */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="h-5 w-5" />
            <h3 className="text-lg font-semibold">What You'll Learn</h3>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {overview.learningOutcomes.map((outcome, i) => (
              <div
                key={i}
                className="flex items-start space-x-3 bg-secondary/50 p-3 rounded-lg"
              >
                <div className="mt-1">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{outcome.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {outcome.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Prerequisites */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Prerequisites</h3>
          </div>
          <div className="space-y-4">
            {overview.prerequisites.map((prereq, i) => (
              <div
                key={i}
                className="bg-secondary/50 p-4 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{prereq.title}</h4>
                  <Badge variant={
                    prereq.level === 'beginner' ? 'default' :
                    prereq.level === 'intermediate' ? 'secondary' :
                    'destructive'
                  }>
                    {prereq.level}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {prereq.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Skills & Tools */}
        <section className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold mb-3">Skills You'll Gain</h3>
            <div className="flex flex-wrap gap-2">
              {overview.skills.map((skill, i) => (
                <Badge key={i} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">Tools You'll Use</h3>
            <div className="flex flex-wrap gap-2">
              {overview.tools.map((tool, i) => (
                <Badge key={i} variant="outline">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        </section>
      </div>
    </ScrollArea>
  );
}