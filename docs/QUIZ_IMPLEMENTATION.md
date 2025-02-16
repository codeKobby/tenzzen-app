# Quiz Implementation with shadcn

## Overview

Interactive quiz component with questions, multiple-choice answers, and results visualization using shadcn components.

## Key Components Used

- Dialog
- Card
- Button
- RadioGroup
- Progress
- Separator
- Alert
- Icons

## Implementation

```tsx
// app/components/quiz-dialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Trophy, X, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

interface QuizQuestion {
  question: string
  options: string[]
  correct_answer: string
  explanation: string
}

interface QuizProps {
  videoId: string
  open: boolean
  onClose: () => void
}

export function QuizDialog({ videoId, open, onClose }: QuizProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)

  const { data: questions, isLoading } = useQuery<QuizQuestion[]>({
    queryKey: ["quiz", videoId],
    queryFn: () => fetchQuiz(videoId),
  })

  const handleSubmit = () => setShowResults(true)

  const score = showResults
    ? Object.entries(answers).reduce(
        (acc, [index, answer]) =>
          acc + (answer === questions?.[Number(index)].correct_answer ? 1 : 0),
        0
      )
    : 0

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium">Generating your quiz...</p>
            <p className="text-sm text-muted-foreground">
              Our AI is analyzing the video content
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Knowledge Check</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {questions?.map((question, index) => (
            <Card key={index} className="relative">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="font-medium">
                    {index + 1}. {question.question}
                  </h3>
                </div>

                <RadioGroup
                  value={answers[index]}
                  onValueChange={(value) =>
                    setAnswers((prev) => ({ ...prev, [index]: value }))
                  }
                  disabled={showResults}
                >
                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => {
                      const value = option[0]
                      const isCorrect = value === question.correct_answer
                      const isSelected = answers[index] === value
                      const showSuccess = showResults && isCorrect
                      const showError = showResults && isSelected && !isCorrect

                      return (
                        <label
                          key={optionIndex}
                          className={cn(
                            "flex items-center space-x-2 rounded-lg border p-4 transition-colors",
                            showSuccess && "border-green-500 bg-green-50",
                            showError && "border-red-500 bg-red-50",
                            !showResults && "hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value={value} />
                          <span className="flex-1">{option}</span>
                          {showSuccess && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                          {showError && (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </label>
                      )
                    })}
                  </div>
                </RadioGroup>

                {showResults && (
                  <Alert className="mt-4">
                    <AlertDescription>
                      {question.explanation}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          {showResults ? (
            <div className="w-full text-center">
              <Trophy className="mx-auto h-12 w-12 text-primary" />
              <h3 className="mt-4 text-xl font-bold">Quiz Complete!</h3>
              <p className="text-sm text-muted-foreground">
                You scored {score} out of {questions?.length} questions correctly
              </p>
              <Button
                className="mt-4"
                onClick={onClose}
              >
                Finish Quiz
              </Button>
            </div>
          ) : (
            <Button
              className="w-full"
              disabled={Object.keys(answers).length !== questions?.length}
              onClick={handleSubmit}
            >
              Submit Answers
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## Features

1. **Quiz Interface**
   - Clean question display
   - Multiple-choice options
   - Progress tracking
   - Results visualization

2. **Interactive Elements**
   - Radio selections
   - Submit button
   - Loading states
   - Success/error indicators

3. **Results View**
   - Score display
   - Correct answers
   - Explanations
   - Visual feedback

4. **Loading State**
   - Loading spinner
   - AI generation message
   - Smooth transitions

## Usage Example

```tsx
// In your video player component
export function VideoPlayer() {
  const [showQuiz, setShowQuiz] = useState(false)

  return (
    <div>
      <Button onClick={() => setShowQuiz(true)}>
        Take Quiz
      </Button>

      <QuizDialog
        videoId={videoId}
        open={showQuiz}
        onClose={() => setShowQuiz(false)}
      />
    </div>
  )
}
```

## Styling

```css
/* Quiz option styles */
.option-label {
  @apply flex items-center space-x-2 rounded-lg border p-4 transition-colors;
}

.option-correct {
  @apply border-green-500 bg-green-50;
}

.option-incorrect {
  @apply border-red-500 bg-red-50;
}

/* Results animation */
@keyframes score-reveal {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.score-animation {
  @apply animate-in zoom-in-50 duration-300;
}
```

This implementation provides an engaging quiz experience using shadcn components while maintaining accessibility and visual consistency.