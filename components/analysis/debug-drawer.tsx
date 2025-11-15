"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Bug, Save, Trash } from "lucide-react";
import { useLogger, type LogEntry, type LogLevel, type LogCategory } from "@/lib/ai/debug-logger";

interface DebugDrawerProps {
  side?: "left" | "right";
  className?: string;
}

export function DebugDrawer({ side = "right", className }: DebugDrawerProps) {
  const logger = useLogger();
  const [open, setOpen] = React.useState(false);
  const [level, setLevel] = React.useState<LogLevel | 'all'>('all');
  const [category, setCategory] = React.useState<LogCategory | 'all'>('all');
  const [logs, setLogs] = React.useState<LogEntry[]>([]);

  // Update logs when filters change
  React.useEffect(() => {
    setLogs(logger.getLogs({
      level: level === 'all' ? undefined : level,
      category: category === 'all' ? undefined : category
    }));
  }, [logger, level, category]);

  const handleExport = () => {
    try {
      const blob = new Blob([logger.exportLogs()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `course-debug-logs-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="fixed bottom-4 right-4 z-50">
          <Bug className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side={side} className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug Console
          </SheetTitle>
        </SheetHeader>

        <div className="my-4 flex items-center gap-2">
          <Select
            value={level}
            onValueChange={(value) => setLevel(value as LogLevel | 'all')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warning</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={category}
            onValueChange={(value) => setCategory(value as LogCategory | 'all')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="stream">Stream</SelectItem>
              <SelectItem value="validation">Validation</SelectItem>
              <SelectItem value="state">State</SelectItem>
              <SelectItem value="ui">UI</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => logger.clearLogs()}>
            <Trash className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExport}>
            <Save className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className="rounded-lg border p-3 text-sm"
              >
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <time dateTime={log.timestamp}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </time>
                  <span className={`uppercase ${
                    log.level === 'error' ? 'text-destructive' :
                    log.level === 'warn' ? 'text-yellow-500' :
                    log.level === 'info' ? 'text-blue-500' :
                    'text-muted-foreground'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-primary">{log.category}</span>
                </div>
                <div className="mt-1 font-mono">
                  {log.message}
                </div>
                {log.data && (
                  <pre className="mt-2 rounded bg-muted p-2 text-xs">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
                {log.error && (
                  <pre className="mt-2 rounded bg-destructive/10 p-2 text-xs text-destructive">
                    {log.error.message}
                    {log.error.stack && `\n${log.error.stack}`}
                  </pre>
                )}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center text-sm text-muted-foreground">
                No logs to display
              </div>
            )}
          </div>
        </ScrollArea>

        <SheetFooter className="mt-4">
          <div className="text-xs text-muted-foreground">
            {logs.length} log entries
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}