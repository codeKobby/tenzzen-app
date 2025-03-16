type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'api' | 'stream' | 'validation' | 'state' | 'ui';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  error?: Error;
}

class DebugLogger {
  private static instance: DebugLogger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled: boolean;

  private constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development';
    if (this.isEnabled && typeof window !== 'undefined') {
      (window as any).__courseDebug = this;
    }
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private addLog(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    error?: Error
  ) {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      ...(data && { data }),
      ...(error && { error })
    };

    this.logs.unshift(entry);

    // Trim logs if they exceed max size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const logFn = console[level] || console.log;
      logFn(
        `[${entry.timestamp}] [${entry.category.toUpperCase()}] ${entry.message}`,
        ...[
          data && { data },
          error && { error }
        ].filter(Boolean)
      );
    }
  }

  debug(category: LogCategory, message: string, data?: any) {
    this.addLog('debug', category, message, data);
  }

  info(category: LogCategory, message: string, data?: any) {
    this.addLog('info', category, message, data);
  }

  warn(category: LogCategory, message: string, data?: any, error?: Error) {
    this.addLog('warn', category, message, data, error);
  }

  error(category: LogCategory, message: string, error?: Error, data?: any) {
    this.addLog('error', category, message, data, error);
  }

  getLogs(
    options: {
      level?: LogLevel;
      category?: LogCategory;
      limit?: number;
    } = {}
  ): LogEntry[] {
    const { level, category, limit } = options;
    
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    if (category) {
      filtered = filtered.filter(log => log.category === category);
    }

    if (limit) {
      filtered = filtered.slice(0, limit);
    }

    return filtered;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      logs: this.logs
    }, null, 2);
  }
}

// Export singleton instance
export const logger = DebugLogger.getInstance();

// Export helper hook for React components
export function useLogger() {
  return logger;
}

// Export type for type checking
export type { LogEntry, LogLevel, LogCategory };