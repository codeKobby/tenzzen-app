/**
 * Structured Logger
 *
 * Provides consistent logging format across the application.
 * Ready for integration with external services (Sentry, Axiom, etc.)
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  correlationId?: string;
  userId?: string;
  module?: string;
  action?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV === "development";

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context && Object.keys(context).length > 0) {
      entry.context = context;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    return entry;
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    const entry = this.formatEntry(level, message, context, error);

    if (this.isDevelopment) {
      // Pretty print in development
      const levelColors: Record<LogLevel, string> = {
        debug: "\x1b[36m", // cyan
        info: "\x1b[32m", // green
        warn: "\x1b[33m", // yellow
        error: "\x1b[31m", // red
      };
      const reset = "\x1b[0m";
      const prefix = `${levelColors[level]}[${level.toUpperCase()}]${reset}`;

      console.log(`${prefix} ${message}`, context ? context : "");
      if (error) {
        console.error(error);
      }
    } else {
      // JSON format in production for log aggregation
      console.log(JSON.stringify(entry));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log("warn", message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log("error", message, context, error);
  }

  // Create a child logger with persistent context
  child(persistentContext: LogContext): ChildLogger {
    return new ChildLogger(this, persistentContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private persistentContext: LogContext,
  ) {}

  private mergeContext(context?: LogContext): LogContext {
    return { ...this.persistentContext, ...context };
  }

  debug(message: string, context?: LogContext): void {
    (this.parent as any).log("debug", message, this.mergeContext(context));
  }

  info(message: string, context?: LogContext): void {
    (this.parent as any).log("info", message, this.mergeContext(context));
  }

  warn(message: string, context?: LogContext): void {
    (this.parent as any).log("warn", message, this.mergeContext(context));
  }

  error(message: string, error?: Error, context?: LogContext): void {
    (this.parent as any).log(
      "error",
      message,
      this.mergeContext(context),
      error,
    );
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export type for external use
export type { LogContext, LogLevel };

// Convenience function to create a correlation ID
export function createCorrelationId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
