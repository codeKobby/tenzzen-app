import React from 'react';

import { AnimatedEmoji } from '@/components/streak/animated-emoji';
import { Timer, ListChecks, Flame } from 'lucide-react';

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
        <div className="flex items-center gap-4 w-full">
            <div className="flex items-center gap-3 shrink-0">
                <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-primary-foreground/10 border border-white/10 ring-4 ring-white/5">
                    <span className="text-2xl font-black text-white bg-gradient-to-b from-yellow-200 to-yellow-500 bg-clip-text text-transparent">
                        {current}
                    </span>
                    {current > 0 && (
                        <div className="absolute -top-1 -right-1">
                            <Flame className="h-4 w-4 text-orange-500 fill-orange-500 animate-pulse" />
                        </div>
                    )}
                </div>
                <div className="flex flex-col justify-center">
                    <p className="text-sm font-bold text-white tracking-tight">
                        {badgeLabel}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-primary-foreground/60 italic">
                            Personal Best: {longest}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex-1 border-l border-white/10 pl-4 flex flex-col justify-center gap-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-primary-foreground/90">
                    <Timer className="h-3.5 w-3.5 text-yellow-300" />
                    <span>{todayMinutes}m today</span>
                    {todayMinutes > 0 && <AnimatedEmoji emoji="⭐" size="sm" />}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-primary-foreground/90">
                    <ListChecks className="h-3.5 w-3.5 text-green-300" />
                    <span>{todayTasks} tasks done</span>
                    {todayTasks > 0 && <AnimatedEmoji emoji="✅" size="sm" />}
                </div>
            </div>

            {/* ARIA live region for screen readers */}
            <span className="sr-only" aria-live="polite">
                Streak updated: {current} day{current !== 1 ? 's' : ''}, longest streak {longest} day{longest !== 1 ? 's' : ''}.
            </span>
        </div>
    );
}
