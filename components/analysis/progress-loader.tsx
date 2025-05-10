import React from 'react';
import { Loader2 } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const progressLoaderVariants = cva(
    "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200",
    {
        variants: {
            visible: {
                true: "opacity-100",
                false: "opacity-0 pointer-events-none",
            },
        },
        defaultVariants: {
            visible: false,
        },
    }
);

export interface ProgressLoaderProps extends VariantProps<typeof progressLoaderVariants> {
    visible: boolean;
    message: string;
    step: number;
    totalSteps: number;
    className?: string;
}

export function ProgressLoader({
    visible,
    message,
    step,
    totalSteps,
    className,
}: ProgressLoaderProps) {
    const progress = Math.round((step / totalSteps) * 100);

    return (
        <div className={cn(progressLoaderVariants({ visible }), className)}>
            <div className="w-full max-w-md p-6 rounded-lg shadow-lg bg-card border flex flex-col items-center">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />

                <div className="space-y-3 w-full">
                    <p className="text-center font-medium">{message}</p>

                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-primary h-full transition-all duration-300 ease-in-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        Step {step} of {totalSteps}
                    </p>
                </div>
            </div>
        </div>
    );
}