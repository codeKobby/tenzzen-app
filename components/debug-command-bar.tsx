"use client";

import * as React from "react";
import { CommandMenu, type CommandItem } from "@/components/ui/command-menu";
import { useLogger } from "@/lib/ai/debug-logger";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Terminal } from "lucide-react";

const SHORTCUTS = {
  openCommandBar: 'Ctrl+Shift+P',
  clearLogs: 'Ctrl+Shift+K',
  exportLogs: 'Ctrl+Shift+E',
  resetState: 'Ctrl+Shift+R'
} as const;

export function DebugCommandBar() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const logger = useLogger();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'p' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commandItems = React.useMemo<CommandItem[]>(() => [
    {
      id: 'home',
      label: 'Go to Home',
      group: 'Navigation',
      onSelect: () => router.push('/')
    },
    {
      id: 'back',
      label: 'Go Back',
      group: 'Navigation',
      onSelect: () => router.back()
    },
    {
      id: 'clear-logs',
      label: 'Clear Logs',
      group: 'Debug',
      shortcut: SHORTCUTS.clearLogs,
      onSelect: () => {
        logger.clearLogs();
        toast.success('Logs cleared');
      }
    },
    {
      id: 'export-logs',
      label: 'Export Logs',
      group: 'Debug',
      shortcut: SHORTCUTS.exportLogs,
      onSelect: () => {
        const blob = new Blob([logger.exportLogs()], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `debug-logs-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Logs exported');
      }
    },
    {
      id: 'reset-state',
      label: 'Reset State',
      group: 'Debug',
      shortcut: SHORTCUTS.resetState,
      onSelect: () => {
        if (confirm('Are you sure you want to reset all state? This cannot be undone.')) {
          localStorage.clear();
          window.location.reload();
        }
      }
    },
    {
      id: 'show-shortcuts',
      label: 'Show All Shortcuts',
      group: 'Help',
      onSelect: () => toast.info('Keyboard shortcuts', {
        description: Object.entries(SHORTCUTS)
          .map(([name, key]) => `${name}: ${key}`)
          .join('\n')
      })
    }
  ], [router, logger]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed bottom-4 right-4 z-50"
        onClick={() => setOpen(true)}
      >
        <Terminal className="h-5 w-5" />
      </Button>

      <CommandMenu
        open={open}
        onOpenChange={setOpen}
        items={commandItems}
        placeholder="Type a command or search..."
      />
    </>
  );
}