"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Brain,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Flame,
    RotateCcw,
    Sparkles,
    Trophy,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSRS, ReviewQuality, SRSItem } from "@/hooks/use-srs";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

// Rating buttons configuration
const ratingButtons = [
    {
        quality: 0 as ReviewQuality,
        label: "Blackout",
        color: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        description: "Complete blackout",
    },
    {
        quality: 1 as ReviewQuality,
        label: "Wrong",
        color: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
        description: "Wrong, but remembered",
    },
    {
        quality: 3 as ReviewQuality,
        label: "Hard",
        color: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
        description: "Correct with difficulty",
    },
    {
        quality: 4 as ReviewQuality,
        label: "Good",
        color: "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20",
        description: "Correct with hesitation",
    },
    {
        quality: 5 as ReviewQuality,
        label: "Easy",
        color: "bg-primary/10 text-primary hover:bg-primary/20",
        description: "Perfect response",
    },
];

export default function ReviewPage() {
    const { isSignedIn } = useAuth();
    const { dueItems, dueCount, loading, reviewItem } = useSRS();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [reviewedCount, setReviewedCount] = useState(0);
    const [sessionComplete, setSessionComplete] = useState(false);

    const currentCard = dueItems[currentIndex];
    const progress = dueCount > 0 ? (reviewedCount / dueCount) * 100 : 0;

    // Handle rating selection
    const handleRate = useCallback(
        async (quality: ReviewQuality) => {
            if (!currentCard) return;

            await reviewItem(currentCard._id, quality);
            setReviewedCount((prev) => prev + 1);
            setShowAnswer(false);

            // Move to next card or complete session
            if (currentIndex < dueItems.length - 1) {
                setCurrentIndex((prev) => prev + 1);
            } else {
                setSessionComplete(true);
            }
        },
        [currentCard, currentIndex, dueItems.length, reviewItem]
    );

    // Reset session
    const handleReset = () => {
        setCurrentIndex(0);
        setShowAnswer(false);
        setReviewedCount(0);
        setSessionComplete(false);
    };

    if (!isSignedIn) {
        return (
            <div className="min-h-screen relative bg-background/50">
                <div className="pattern-dots opacity-40 fixed inset-0 z-0 pointer-events-none" />
                <div className="background-gradient fixed inset-0 z-0 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <Brain className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Sign in to Review</h2>
                    <p className="text-muted-foreground mb-6">
                        Access your spaced repetition flashcards after signing in.
                    </p>
                    <Button asChild>
                        <Link href="/sign-in">Sign In</Link>
                    </Button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen relative bg-background/50">
                <div className="pattern-dots opacity-40 fixed inset-0 z-0 pointer-events-none" />
                <div className="background-gradient fixed inset-0 z-0 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh]">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                        <Brain className="h-16 w-16 text-primary/50" />
                        <p className="text-muted-foreground">Loading your review deck...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (dueCount === 0 || sessionComplete) {
        return (
            <div className="min-h-screen relative bg-background/50">
                <div className="pattern-dots opacity-40 fixed inset-0 z-0 pointer-events-none" />
                <div className="background-gradient fixed inset-0 z-0 pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="mb-6"
                    >
                        <div className="relative">
                            <Trophy className="h-20 w-20 text-primary" />
                            <Sparkles className="h-8 w-8 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                        </div>
                    </motion.div>

                    <h2 className="text-3xl font-bold mb-2">
                        {sessionComplete ? "Session Complete!" : "All Caught Up!"}
                    </h2>
                    <p className="text-muted-foreground mb-2 max-w-md">
                        {sessionComplete
                            ? `You reviewed ${reviewedCount} cards. Great job!`
                            : "You have no cards due for review right now."}
                    </p>
                    {sessionComplete && (
                        <p className="text-sm text-muted-foreground mb-6">
                            Come back tomorrow for your next review session.
                        </p>
                    )}

                    <div className="flex gap-3">
                        {sessionComplete && (
                            <Button variant="outline" onClick={handleReset}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Review Again
                            </Button>
                        )}
                        <Button asChild>
                            <Link href="/dashboard">Back to Dashboard</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative bg-background/50">
            {/* Background Patterns */}
            <div className="pattern-dots opacity-40 fixed inset-0 z-0 pointer-events-none" />
            <div className="background-gradient fixed inset-0 z-0 pointer-events-none" />

            <div className="relative z-10">
                {/* Header */}
                <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-sm border-b">
                    <div className="max-w-3xl mx-auto px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Brain className="h-6 w-6 text-primary" />
                                <h1 className="text-lg font-semibold">Daily Review</h1>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Flame className="h-4 w-4 text-orange-500" />
                                <span>
                                    {reviewedCount}/{dueCount} cards
                                </span>
                            </div>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>

                {/* Main Card Area */}
                <main className="max-w-3xl mx-auto px-4 py-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentCard._id}
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className="min-h-[400px] relative overflow-hidden">
                                {/* Card Type Badge */}
                                <div className="absolute top-4 right-4">
                                    <span
                                        className={cn(
                                            "text-xs px-2 py-1 rounded-full",
                                            currentCard.cardType === "quiz" &&
                                            "bg-primary/10 text-primary",
                                            currentCard.cardType === "key_point" &&
                                            "bg-emerald-500/10 text-emerald-500",
                                            currentCard.cardType === "user_created" &&
                                            "bg-blue-500/10 text-blue-500"
                                        )}
                                    >
                                        {currentCard.cardType === "quiz" && "Quiz"}
                                        {currentCard.cardType === "key_point" && "Key Point"}
                                        {currentCard.cardType === "user_created" && "Custom"}
                                    </span>
                                </div>

                                <CardHeader className="pb-4">
                                    <CardTitle className="text-sm text-muted-foreground font-normal">
                                        Card {currentIndex + 1} of {dueItems.length}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    {/* Question */}
                                    <div className="text-center py-8">
                                        <p className="text-xl font-medium leading-relaxed">
                                            {currentCard.front}
                                        </p>
                                    </div>

                                    {/* Answer (revealed) */}
                                    <AnimatePresence>
                                        {showAnswer && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="border-t pt-6"
                                            >
                                                <p className="text-muted-foreground text-sm mb-2">
                                                    Answer:
                                                </p>
                                                <p className="text-lg">{currentCard.back}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </AnimatePresence>

                    {/* Action Buttons */}
                    <div className="mt-6">
                        {!showAnswer ? (
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg"
                                onClick={() => setShowAnswer(true)}
                            >
                                Show Answer
                            </Button>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-center text-sm text-muted-foreground">
                                    How well did you know this?
                                </p>
                                <div className="grid grid-cols-5 gap-2">
                                    {ratingButtons.map((btn) => (
                                        <Button
                                            key={btn.quality}
                                            variant="ghost"
                                            className={cn(
                                                "h-16 flex flex-col items-center justify-center gap-1 rounded-xl transition-all",
                                                btn.color
                                            )}
                                            onClick={() => handleRate(btn.quality)}
                                        >
                                            <span className="text-sm font-medium">{btn.label}</span>
                                            <span className="text-[10px] opacity-70">
                                                {btn.description}
                                            </span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Navigation Hints */}
                    <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                                Space
                            </kbd>
                            Show Answer
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                                1-5
                            </kbd>
                            Rate Card
                        </span>
                    </div>
                </main>
            </div>
        </div>
    );
}
