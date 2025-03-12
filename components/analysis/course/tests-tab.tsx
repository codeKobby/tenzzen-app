"use client"

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { CourseGenerationResult, CourseProgress, CourseTest } from '@/types/ai';
import {
  Lock,
  CheckCircle,
  Timer,
  Trophy,
  ListChecks,
  AlertCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';

interface CourseTestsTabProps {
  content: CourseGenerationResult;
  progress: CourseProgress;
  onTestComplete: (testId: string, score: number) => void;
}

export function CourseTestsTab({ 
  content, 
  progress, 
  onTestComplete 
}: CourseTestsTabProps) {
  const [selectedTest, setSelectedTest] = React.useState<CourseTest | null>(null);
  const [currentQuestion, setCurrentQuestion] = React.useState(0);
  const [answers, setAnswers] = React.useState<number[]>([]);
  const [showResults, setShowResults] = React.useState(false);

  const allTests = React.useMemo(() => {
    return content.sections.flatMap(section => 
      section.lessons
        .filter(lesson => lesson.test)
        .map(lesson => lesson.test!)
    );
  }, [content.sections]);

  // Check if a test is locked
  const isTestLocked = React.useCallback((test: CourseTest) => {
    if (!test.unlockCondition) return false;

    const { type, id } = test.unlockCondition;
    if (type === 'section') {
      const section = content.sections.find(s => s.id === id);
      if (!section) return true;
      return !section.lessons.every(lesson => 
        progress.completedLessons.includes(lesson.id)
      );
    }

    if (type === 'lesson') {
      return !progress.completedLessons.includes(id);
    }

    if (type === 'test') {
      return !progress.completedTests.includes(id);
    }

    return false;
  }, [content.sections, progress.completedLessons, progress.completedTests]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    if (!selectedTest) return 0;
    const correctAnswers = answers.reduce((count, answer, index) => {
      return count + (answer === selectedTest.questions[index].correctAnswer ? 1 : 0);
    }, 0);
    return Math.round((correctAnswers / selectedTest.questions.length) * 100);
  };

  const handleTestSubmit = () => {
    const score = calculateScore();
    if (selectedTest) {
      onTestComplete(selectedTest.id, score);
    }
    setShowResults(true);
  };

  const startTest = (test: CourseTest) => {
    setSelectedTest(test);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResults(false);
  };

  return (
    <div className="space-y-6">
      {/* Tests Overview */}
      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="grid gap-6 md:grid-cols-2 pr-4">
          {allTests.map((test) => {
            const isLocked = isTestLocked(test);
            const isCompleted = progress.completedTests.includes(test.id);
            const score = progress.testScores[test.id];

            return (
              <Card key={test.id} className={cn(
                "transition-colors",
                isLocked && "opacity-60"
              )}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {test.title}
                    {isLocked ? (
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    ) : isCompleted ? (
                      <Badge variant="secondary" className="gap-1">
                        <Trophy className="h-3 w-3" />
                        {score}%
                      </Badge>
                    ) : (
                      <ListChecks className="h-5 w-5 text-primary" />
                    )}
                  </CardTitle>
                  <CardDescription>{test.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Timer className="h-4 w-4" />
                        {test.timeLimit} mins
                      </div>
                      <div className="flex items-center gap-1">
                        <ListChecks className="h-4 w-4" />
                        {test.questions.length} questions
                      </div>
                      <div className="flex items-center gap-1">
                        <Trophy className="h-4 w-4" />
                        {test.passingScore}% to pass
                      </div>
                    </div>

                    {!isLocked && !isCompleted && (
                      <Button 
                        className="w-full" 
                        onClick={() => startTest(test)}
                      >
                        Start Test
                      </Button>
                    )}

                    {isCompleted && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Your Score</span>
                          <span className="font-medium">{score}%</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    )}

                    {isLocked && test.unlockCondition && (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 mt-0.5" />
                        <span>
                          Complete {test.unlockCondition.type} "{test.unlockCondition.id}" to unlock
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Test Dialog */}
      <Dialog 
        open={!!selectedTest} 
        onOpenChange={(open) => !open && setSelectedTest(null)}
      >
        <DialogContent className="max-w-2xl">
          {selectedTest && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTest.title}</DialogTitle>
                <DialogDescription>
                  Question {currentQuestion + 1} of {selectedTest.questions.length}
                </DialogDescription>
              </DialogHeader>

              {showResults ? (
                <div className="space-y-6 py-4">
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {calculateScore() >= selectedTest.passingScore ? (
                        <Trophy className="h-12 w-12 text-primary" />
                      ) : (
                        <AlertCircle className="h-12 w-12 text-destructive" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium mb-1">
                      Your Score: {calculateScore()}%
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {calculateScore() >= selectedTest.passingScore
                        ? "Congratulations! You've passed the test."
                        : `You need ${selectedTest.passingScore}% to pass. Try again!`}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedTest.questions.map((question, index) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg",
                          answers[index] === question.correctAnswer
                            ? "bg-primary/10"
                            : "bg-destructive/10"
                        )}
                      >
                        <p className="font-medium mb-2">{question.question}</p>
                        <div className="grid gap-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded",
                                optionIndex === question.correctAnswer
                                  ? "text-primary"
                                  : answers[index] === optionIndex
                                  ? "text-destructive"
                                  : ""
                              )}
                            >
                              {optionIndex === question.correctAnswer ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <div className="h-4 w-4" />
                              )}
                              <span>{option}</span>
                            </div>
                          ))}
                        </div>
                        {answers[index] !== question.correctAnswer && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">
                      {selectedTest.questions[currentQuestion].question}
                    </h3>
                    <RadioGroup
                      value={answers[currentQuestion]?.toString()}
                      onValueChange={(value) => 
                        handleAnswerSelect(currentQuestion, parseInt(value))
                      }
                    >
                      {selectedTest.questions[currentQuestion].options.map(
                        (option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={index.toString()} id={`q${currentQuestion}-${index}`} />
                            <Label htmlFor={`q${currentQuestion}-${index}`}>{option}</Label>
                          </div>
                        )
                      )}
                    </RadioGroup>
                  </div>
                </div>
              )}

              <DialogFooter>
                {showResults ? (
                  <Button onClick={() => setSelectedTest(null)}>Close</Button>
                ) : (
                  <div className="flex justify-between w-full">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestion((prev) => prev - 1)}
                      disabled={currentQuestion === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => {
                        if (currentQuestion === selectedTest.questions.length - 1) {
                          handleTestSubmit();
                        } else {
                          setCurrentQuestion((prev) => prev + 1);
                        }
                      }}
                      disabled={answers[currentQuestion] === undefined}
                    >
                      {currentQuestion === selectedTest.questions.length - 1
                        ? "Submit"
                        : "Next"}
                    </Button>
                  </div>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}