"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Brain, Flame, ChevronRight, Sparkles } from "lucide-react";
import { useSRS } from "@/hooks/use-srs";
import Link from "next/link";
import { cn } from "@/lib/utils";

const REVIEW_PATH = "/review" as const;

export function SRSReviewWidget() {
    const { dueCount, allItems, loading } = useSRS();

    const masteredCount = allItems.filter((item) => item.repetitions >= 5).length;
    const learningCount = allItems.length - masteredCount;
    const masteryPercentage =
        allItems.length > 0 ? (masteredCount / allItems.length) * 100 : 0;

    if (loading) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Brain className="h-4 w-4 text-primary" />
                        Spaced Repetition
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 animate-pulse">
                        <div className="h-16 bg-muted rounded-lg" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-2 bg-muted rounded" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Brain className="h-4 w-4 text-primary" />
                        Spaced Repetition
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                        <Link href={"/dashboard/review" as any}>
                            View All
                            <ChevronRight className="h-3 w-3 ml-1" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Due Cards CTA */}
                {dueCount > 0 ? (
                    <Link href={"/dashboard/review" as any}>
                        <div
                            className={cn(
                                "relative overflow-hidden rounded-lg p-4",
                                "bg-gradient-to-br from-primary/10 via-primary/5 to-transparent",
                                "border border-primary/20 hover:border-primary/40 transition-colors",
                                "group cursor-pointer"
                            )}
                        >
                            <div className="pattern-dots absolute inset-0 opacity-30" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 text-primary">
                                        <Flame className="h-5 w-5" />
                                        <span className="text-2xl font-bold">{dueCount}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        cards due for review
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    className="group-hover:bg-primary/90 transition-colors"
                                >
                                    <Sparkles className="h-4 w-4 mr-1" />
                                    Review Now
                                </Button>
                            </div>
                        </div>
                    </Link>
                ) : (
                    <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">No cards due today! 🎉</p>
                        <p className="text-xs mt-1">Come back tomorrow for your next review.</p>
                    </div>
                )}

                {/* Stats */}
                {allItems.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Mastery Progress</span>
                            <span className="font-medium">
                                {masteredCount}/{allItems.length} cards
                            </span>
                        </div>
                        <Progress value={masteryPercentage} className="h-2" />
                        <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-muted/50 rounded-md p-2 text-center">
                                <p className="font-medium text-primary">{learningCount}</p>
                                <p className="text-muted-foreground">Learning</p>
                            </div>
                            <div className="bg-muted/50 rounded-md p-2 text-center">
                                <p className="font-medium text-emerald-500">{masteredCount}</p>
                                <p className="text-muted-foreground">Mastered</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {allItems.length === 0 && (
                    <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground">
                            Complete quizzes to add cards to your review deck.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
