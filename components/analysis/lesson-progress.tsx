'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LessonProgressProps {
  currentLesson: number;
  totalLessons: number;
  onPrevious?: () => void;
  onNext?: () => void;
  isFirstLesson?: boolean;
  isLastLesson?: boolean;
}

export function LessonProgress({
  currentLesson,
  totalLessons,
  onPrevious,
  onNext,
  isFirstLesson,
  isLastLesson
}: LessonProgressProps) {
  const progress = Math.round((currentLesson / totalLessons) * 100);

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Progress display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Lesson {currentLesson} of {totalLessons}</span>
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={isFirstLesson}
            className={cn(
              "w-[100px]",
              isFirstLesson && "opacity-50 cursor-not-allowed"
            )}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant={isLastLesson ? "default" : "outline"}
            size="sm"
            onClick={onNext}
            disabled={isLastLesson}
            className={cn(
              "w-[100px]",
              isLastLesson && "opacity-50 cursor-not-allowed"
            )}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}