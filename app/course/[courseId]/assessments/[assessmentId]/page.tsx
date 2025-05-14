"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useAssessment } from "@/hooks/use-assessment";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function AssessmentPage() {
  const params = useParams();
  const courseId = typeof params.courseId === 'string' ? params.courseId : '';
  const assessmentId = typeof params.assessmentId === 'string' ? params.assessmentId : '';
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const {
    content,
    isLoading,
    progress,
    error,
    startAssessment,
    submitAssessment
  } = useAssessment({
    courseId: courseId as string,
    sectionId: "", // We'll get this from the query
    assessmentId: assessmentId as string
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Not Available</CardTitle>
            <CardDescription>
              This assessment hasn't been generated yet.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Handle answer selection
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Handle assessment submission
  const handleSubmit = async () => {
    try {
      await submitAssessment(answers);
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit assessment:", err);
    }
  };

  // Show results if completed
  if (progress?.status === "completed" || submitted) {
    return (
      <div className="container max-w-4xl py-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Complete</CardTitle>
            <CardDescription>
              {progress?.score !== undefined
                ? `Your score: ${progress.score}%`
                : "Your submission is being reviewed."
              }
            </CardDescription>
          </CardHeader>
          {progress?.feedback && (
            <CardContent>
              <div className="prose dark:prose-invert">
                <h3>Feedback</h3>
                <p>{progress.feedback}</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8 space-y-6">
      {/* Assessment Header */}
      <Card>
        <CardHeader>
          <CardTitle>{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {content.questions?.map((question, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-lg">
                Question {index + 1}
              </CardTitle>
              <CardDescription className="text-base">
                {question.question}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {question.type === "multiple-choice" && question.options ? (
                <RadioGroup
                  value={answers[`q${index}`]}
                  onValueChange={(value) => handleAnswerChange(`q${index}`, value)}
                >
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={option}
                        id={`q${index}-opt${optIndex}`}
                      />
                      <Label htmlFor={`q${index}-opt${optIndex}`}>
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder="Enter your answer..."
                  value={answers[`q${index}`] || ""}
                  onChange={(e) => handleAnswerChange(`q${index}`, e.target.value)}
                  rows={4}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={
            !content.questions?.every((_, i) => answers[`q${i}`]) ||
            progress?.status === "completed"
          }
        >
          Submit Assessment
        </Button>
      </div>
    </div>
  );
}