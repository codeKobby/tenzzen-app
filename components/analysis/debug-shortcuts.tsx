"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { SHORTCUTS } from "@/hooks/use-debug-keys";

export function DebugShortcuts() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Keyboard className="h-4 w-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Debug keyboard shortcuts for development testing
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {SHORTCUTS.map(({ key, description }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span className="text-sm text-muted-foreground">
                {description}
              </span>
              <kbd className="rounded bg-muted px-2 py-1 font-mono text-sm">
                {key}
              </kbd>
            </div>
          ))}
          <div className="text-xs text-muted-foreground">
            Note: These shortcuts are only available in development mode
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}