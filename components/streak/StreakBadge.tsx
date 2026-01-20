import React from 'react';

import { AnimatedEmoji } from '@/components/streak/animated-emoji';
import { Timer, ListChecks } from 'lucide-react';

interface StreakBadgeProps {
    current: number;
    longest: number;
    todayMinutes: number;
    todayTasks: number;
    loading?: boolean;
}

/**
 * Displays the user's streak information with accessible ARIA live region.
 * Uses design tokens from the design system and shadcn UI components.
 */
export function StreakBadge({
    current,
    longest,
    todayMinutes,
    todayTasks,
    loading = false,
}: StreakBadgeProps) {
    const badgeLabel =
        current === 1
            ? 'First day!'
            : current > 1
                ? current === longest
                    ? 'New record!'
                    : 'Day streak!'
                : 'Start your streak!';

    const emoji =
        current >= 100
            ? '🏆'
            : current >= 30
                ? '🔥'
                : current >= 14
                    ? '💪'
                    : current >= 7
                        ? '✨'
                        : current >= 3
                            ? '🌱'
                            : '🎯';

    return (
        <div className="rounded-lg bg-primary-foreground/10 p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="rounded-lg bg-primary-foreground/10 p-2 shrink-0">
                    <span className="text-2xl font-bold text-white bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                        {current}
                    </span>
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-primary-foreground/70 truncate">
                        {badgeLabel}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-primary-foreground/90">
                        <Timer className="h-3.5 w-3.5 text-yellow-300" />
                        <span>{todayMinutes}m today</span>
                        {todayMinutes > 0 && <AnimatedEmoji emoji="⭐" size="sm" className="ml-1" />}
                        <ListChecks className="h-3.5 w-3.5 text-green-300 ml-2" />
                        <span>{todayTasks} tasks done</span>
                        {todayTasks > 0 && <AnimatedEmoji emoji="✅" size="sm" className="ml-1" />}
                    </div>
                </div>
                <div className="flex flex-col justify-between items-end">
                    <div className="flex flex-col gap-1.5 text-xs text-primary-foreground/90">
                        <span className="flex items-center gap-1.5">
                            Best: {longest} days
                            {current >= longest && longest > 0 && (
                                <AnimatedEmoji emoji="🏆" size="sm" />
                            )}
                        </span>
                    </div>
                </div>
            </div>
            {/* ARIA live region for screen readers */}
            <span className="sr-only" aria-live="polite">
                Streak updated: {current} day{current !== 1 ? 's' : ''}, longest streak {longest} day{longest !== 1 ? 's' : ''}.
            </span>
        </div>
    );
}
