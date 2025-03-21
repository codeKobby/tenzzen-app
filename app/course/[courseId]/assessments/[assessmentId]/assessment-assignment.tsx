"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useAssessment } from "@/hooks/use-assessment-provider";
import { AssignmentContent } from "@/types/course";

interface TaskSubmission {
  [key: string]: {
    solution: string;
    status: "not_started" | "in_progress" | "completed";
  };
}

export function AssessmentAssignment() {
  const [submissions, setSubmissions] = useState<TaskSubmission>({});
  const { content, submitAssessment } = useAssessment();
  const assignment = content as AssignmentContent;

  const handleTaskUpdate = useCallback((taskId: string, solution: string) => {
    setSubmissions(prev => ({
      ...prev,
      [taskId]: {
        solution,
        status: solution.trim() ? "in_progress" : "not_started"
      }
    }));
  }, []);

  const handleTaskComplete = useCallback((taskId: string) => {
    setSubmissions(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        status: "completed"
      }
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      await submitAssessment(submissions);
    } catch (err) {
      console.error("Failed to submit assignment:", err);
    }
  }, [submissions, submitAssessment]);

  return (
    <div className="space-y-8">
      {/* Task List */}
      {assignment.tasks.map((task, index) => {
        const taskId = `task${index}`;
        const submission = submissions[taskId];

        return (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Task {index + 1}: {task.title}</span>
                {submission?.status === "completed" && (
                  <Icons.check className="h-5 w-5 text-green-500" />
                )}
              </CardTitle>
              <CardDescription className="text-base whitespace-pre-wrap">
                {task.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Acceptance Criteria */}
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Acceptance Criteria:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {task.acceptance.map((criterion, i) => (
                    <li key={i} className="text-sm">{criterion}</li>
                  ))}
                </ul>
              </div>

              {/* Solution Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Solution:</label>
                <Textarea
                  placeholder="Enter your solution..."
                  value={submission?.solution || ""}
                  onChange={(e) => handleTaskUpdate(taskId, e.target.value)}
                  rows={6}
                />
              </div>

              {/* Task Actions */}
              <div className="flex justify-end">
                {task.hint && (
                  <Button variant="ghost" className="mr-2">
                    <Icons.help className="mr-2 h-4 w-4" />
                    Show Hint
                  </Button>
                )}
                <Button
                  variant="secondary"
                  disabled={!submission?.solution || submission.status === "completed"}
                  onClick={() => handleTaskComplete(taskId)}
                >
                  Mark as Complete
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={
            !Object.values(submissions).every(s => s.status === "completed")
          }
        >
          Submit Assignment
        </Button>
      </div>
    </div>
  );
}