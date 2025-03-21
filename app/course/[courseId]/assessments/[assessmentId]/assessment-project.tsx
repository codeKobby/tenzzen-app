"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { useAssessment } from "@/hooks/use-assessment-provider";
import { ProjectContent } from "@/types/course";
import { cn } from "@/lib/utils";

interface ProjectSubmission {
  files?: File[];
  repoUrl?: string;
  notes: string;
}

export function AssessmentProject() {
  const [submission, setSubmission] = useState<ProjectSubmission>({
    notes: ""
  });
  const { content, submitAssessment } = useAssessment();
  const project = content as ProjectContent;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSubmission(prev => ({
        ...prev,
        files: Array.from(e.target.files!)
      }));
    }
  }, []);

  const handleRepoUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSubmission(prev => ({
      ...prev,
      repoUrl: e.target.value
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      await submitAssessment(submission);
    } catch (err) {
      console.error("Failed to submit project:", err);
    }
  }, [submission, submitAssessment]);

  const isValidSubmission = () => {
    const hasFiles = submission.files && submission.files.length > 0;
    const hasRepo = submission.repoUrl && submission.repoUrl.trim().length > 0;
    return project.submissionFormats.some(format => {
      if (format === "file upload") return hasFiles;
      if (format === "git repo link") return hasRepo;
      return false;
    });
  };

  return (
    <div className="space-y-8">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Guidelines</CardTitle>
          <CardDescription>
            Due: {project.deadline}
          </CardDescription>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">
          <div 
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: project.guidelines }}
          />
        </CardContent>
      </Card>

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle>Submit Your Project</CardTitle>
          <CardDescription>
            Choose your submission method below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          {project.submissionFormats.includes("file upload") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Upload Project Files
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {submission.files?.length ? (
                  <Icons.check className="h-5 w-5 text-green-500" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                You can upload multiple files
              </p>
            </div>
          )}

          {/* Repository Link */}
          {project.submissionFormats.includes("git repo link") && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Git Repository URL
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={submission.repoUrl || ""}
                  onChange={handleRepoUrlChange}
                  className="flex-1"
                />
                {submission.repoUrl ? (
                  <Icons.check className="h-5 w-5 text-green-500" />
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure your repository is public or shared with the course team
              </p>
            </div>
          )}

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Additional Notes
            </label>
            <Input
              placeholder="Any comments or notes about your submission..."
              value={submission.notes}
              onChange={(e) => setSubmission(prev => ({ ...prev, notes: e.target.value }))}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="ml-auto"
            onClick={handleSubmit}
            disabled={!isValidSubmission()}
          >
            Submit Project
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}