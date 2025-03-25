'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Check, X, XCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

// Toast manager event system
type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

class ToastEventManager {
    private listeners: Array<(toast: Toast) => void> = [];
    private dismissListeners: Array<(id?: string) => void> = [];

    subscribe(listener: (toast: Toast) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    subscribeToDismiss(listener: (id?: string) => void) {
        this.dismissListeners.push(listener);
        return () => {
            this.dismissListeners = this.dismissListeners.filter(l => l !== listener);
        };
    }

    emit(toast: Toast) {
        this.listeners.forEach(listener => listener(toast));
    }

    emitDismiss(id?: string) {
        this.dismissListeners.forEach(listener => listener(id));
    }
}

// Create a singleton toast event manager
export const toastEvents = new ToastEventManager();

// Helper functions to show toasts
export const toast = {
    success: (title: string, description?: string, duration: number = 5000) => {
        const id = Date.now().toString();
        toastEvents.emit({ id, type: 'success', title, description, duration });
        return id;
    },

    error: (title: string, description?: string, duration: number = 5000) => {
        const id = Date.now().toString();
        toastEvents.emit({ id, type: 'error', title, description, duration });
        return id;
    },

    info: (title: string, description?: string, duration: number = 5000) => {
        const id = Date.now().toString();
        toastEvents.emit({ id, type: 'info', title, description, duration });
        return id;
    },

    warning: (title: string, description?: string, duration: number = 5000) => {
        const id = Date.now().toString();
        toastEvents.emit({ id, type: 'warning', title, description, duration });
        return id;
    },

    dismiss: (id?: string) => {
        toastEvents.emitDismiss(id);
    }
};

// Individual toast component
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
    const { id, type, title, description, duration = 5000 } = toast;

    // Set up auto-dismiss
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onDismiss();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onDismiss]);

    // Icon based on type
    const Icon = {
        success: Check,
        error: XCircle,
        info: Info,
        warning: AlertTriangle
    }[type];

    // Colors based on type
    const colorClasses = {
        success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
        error: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
        info: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
        warning: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800'
    }[type];

    const iconColorClasses = {
        success: 'text-green-600 dark:text-green-400',
        error: 'text-red-600 dark:text-red-400',
        info: 'text-blue-600 dark:text-blue-400',
        warning: 'text-amber-600 dark:text-amber-400'
    }[type];

    return (
        <div
            className={cn(
                'flex w-full max-w-sm overflow-hidden rounded-lg border shadow-lg animate-in slide-in-from-right-full duration-300',
                colorClasses
            )}
            style={{ minWidth: '300px' }}
        >
            <div className="flex w-full items-center gap-3 p-4">
                <div className={cn('shrink-0', iconColorClasses)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <h3 className="font-medium">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                    )}
                </div>
                <button
                    onClick={onDismiss}
                    className="text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

// Toast container component
export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Only mount on client side
    useEffect(() => {
        setIsMounted(true);

        // Subscribe to toast events
        const unsubscribe = toastEvents.subscribe((toast) => {
            // Use functional update to avoid React state issues
            setToasts(prev => [...prev, toast]);
        });

        // Subscribe to dismiss events
        const unsubscribeDismiss = toastEvents.subscribeToDismiss((id) => {
            // If id is undefined, clear all toasts
            if (id === undefined) {
                setToasts([]);
                return;
            }

            // Otherwise remove specific toast
            setToasts(prev => prev.filter(t => t.id !== id));
        });

        return () => {
            unsubscribe();
            unsubscribeDismiss();
        };
    }, []);

    const handleDismiss = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    // Don't render anything on server
    if (!isMounted) return null;

    // Use createPortal to render at root level
    return createPortal(
        <div
            ref={containerRef}
            aria-live="assertive"
            className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end"
        >
            {toasts.map(toast => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onDismiss={() => handleDismiss(toast.id)}
                />
            ))}
        </div>,
        document.body
    );
}
