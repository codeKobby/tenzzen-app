"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Id } from "@/convex/_generated/dataModel";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Icons } from "@/components/ui/icons";
import { AssessmentProvider, useAssessment } from "@/hooks/use-assessment-provider";
import { AssessmentBase, isTestContent, isAssignmentContent, isProjectContent } from "@/types/course";
import { cn } from "@/lib/utils";

interface AssessmentContentProps {
  type: "test" | "assignment" | "project";
}

function AssessmentContent({ type }: AssessmentContentProps) {
  const { content, isGenerating } = useAssessment();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content || isGenerating) {
    return (
      <div className="flex justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start"
        onClick={() => setIsExpanded(true)}
      >
        <Icons.chevronDown className="mr-2 h-4 w-4" />
        Show details
      </Button>
    );
  }

  switch (type) {
    case "test":
      if (isTestContent(content)) {
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {content.questions.length} questions
            </p>
            {content.questions[0] && (
              <div className="mt-2 rounded-lg bg-muted p-4">
                <p>{content.questions[0].question}</p>
              </div>
            )}
          </div>
        );
      }
      break;

    case "assignment":
      if (isAssignmentContent(content)) {
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {content.tasks.length} tasks to complete
            </p>
            {content.tasks[0] && (
              <div className="mt-2 rounded-lg bg-muted p-4">
                <p className="font-medium">{content.tasks[0].title}</p>
                <p className="text-sm">{content.tasks[0].description}</p>
              </div>
            )}
          </div>
        );
      }
      break;

    case "project":
      if (isProjectContent(content)) {
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Deadline: {content.deadline}
            </p>
            <div className="mt-2 rounded-lg bg-muted p-4">
              <p>{content.guidelines}</p>
            </div>
          </div>
        );
      }
      break;
  }

  return (
    <div className="p-4 text-sm text-muted-foreground">
      Content not available
    </div>
  );
}

interface AssessmentCardInnerProps {
  title: string;
  description: string;
  type: "test" | "assignment" | "project";
  context: string;
}

function AssessmentCardInner({
  title,
  description,
  type,
  context
}: AssessmentCardInnerProps) {
  const {
    content,
    isLoading,
    isGenerating,
    progress,
    isLocked,
    generateContent,
    unlockAssessment,
    startAssessment,
    error
  } = useAssessment();

  // Handle starting the assessment
  const handleStart = async () => {
    try {
      if (!content) {
        await generateContent(context);
      }
      await startAssessment();
    } catch (err) {
      console.error("Failed to start assessment:", err);
    }
  };

  // Handle unlocking the assessment
  const handleUnlock = async () => {
    try {
      await unlockAssessment();
    } catch (err) {
      console.error("Failed to unlock assessment:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {type === "test" && (
              <Icons.clipboard className="h-5 w-5 text-muted-foreground" />
            )}
            {type === "assignment" && (
              <Icons.edit className="h-5 w-5 text-muted-foreground" />
            )}
            {type === "project" && (
              <Icons.rocket className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : (
          <AssessmentContent type={type} />
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex items-center space-x-2">
          {progress?.status === "completed" ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Icons.check className="mr-2 h-4 w-4 text-green-500" />
              Completed
              {progress.score && ` - Score: ${progress.score}%`}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Estimated time: {content?.estimatedDuration}
            </p>
          )}
        </div>

        <div className="flex space-x-2">
          {isLocked ? (
            <Button
              variant="outline"
              onClick={handleUnlock}
              disabled={isLoading || isGenerating}
            >
              <Icons.lock className="mr-2 h-4 w-4" />
              Unlock
            </Button>
          ) : (
            <Button
              onClick={handleStart}
              disabled={
                isLoading || 
                isGenerating || 
                progress?.status === "completed"
              }
            >
              {isGenerating ? (
                <LoadingSpinner className="mr-2" />
              ) : (
                <Icons.play className="mr-2 h-4 w-4" />
              )}
              {progress?.status === "in_progress" ? "Continue" : "Start"}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

interface AssessmentCardProps {
  courseId: Id<"courses">;
  sectionId: string;
  assessmentId: string;
  title: string;
  description: string;
  type: "test" | "assignment" | "project";
  context: string;
  assessment: AssessmentBase;
}

export function AssessmentCard({
  courseId,
  sectionId,
  assessmentId,
  title,
  description,
  type,
  context,
  assessment
}: AssessmentCardProps) {
  return (
    <AssessmentProvider
      courseId={courseId}
      sectionId={sectionId}
      assessmentId={assessmentId}
      assessment={assessment}
    >
      <AssessmentCardInner
        title={title}
        description={description}
        type={type}
        context={context}
      />
    </AssessmentProvider>
  );
}
