"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAssessment } from "@/hooks/use-assessment-provider";
import { TestContent } from "@/types/course";

interface TestSubmission {
  [key: string]: string;
}

export function AssessmentTest() {
  const [answers, setAnswers] = useState<TestSubmission>({});
  const { content, submitAssessment } = useAssessment();
  const test = content as TestContent;

  const handleAnswerChange = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      await submitAssessment(answers);
    } catch (err) {
      console.error("Failed to submit test:", err);
    }
  }, [answers, submitAssessment]);

  return (
    <div className="space-y-8">
      {/* Question List */}
      {test.questions.map((question, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-lg">
              Question {index + 1}
            </CardTitle>
            <CardDescription className="text-base whitespace-pre-wrap">
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

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!test.questions?.every((_, i) => answers[`q${i}`])}
        >
          Submit Test
        </Button>
      </div>
    </div>
  );
}