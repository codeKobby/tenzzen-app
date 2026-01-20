import { render, screen } from '@testing-library/react';
import { StreakBadge } from '@/components/streak/StreakBadge';
import { describe, expect, it, vi } from 'vitest';

// Mock AnimatedEmoji to avoid fetch/Lottie issues in tests
vi.mock('@/components/streak/animated-emoji', () => ({
    AnimatedEmoji: ({ emoji }: { emoji: string }) => <span data-testid="animated-emoji">{emoji}</span>,
}));

describe('StreakBadge', () => {
    it('renders current streak and longest streak', () => {
        render(
            <StreakBadge
                current={5}
                longest={10}
                todayMinutes={30}
                todayTasks={2}
                loading={false}
            />
        );
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText(/Best: 10 days/)).toBeInTheDocument();
        expect(screen.getByText('30m today')).toBeInTheDocument();
        expect(screen.getByText('2 tasks done')).toBeInTheDocument();
    });

    it('shows loading state when loading', () => {
        render(
            <StreakBadge
                current={0}
                longest={0}
                todayMinutes={0}
                todayTasks={0}
                loading={true}
            />
        );
        // In loading state, we might show a spinner or aria live region; ensure component renders without error
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});
