// Removed "use client"; directive to allow server-side usage

// Types for log levels and log entries
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  data?: any;
}

// Configuration for the logger
interface LoggerConfig {
  enableConsole?: boolean;
  enableRemoteLogging?: boolean;
  logLevel?: LogLevel;
}

// Log levels and their priorities
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Global configuration with defaults
const config: LoggerConfig = {
  enableConsole: true,
  enableRemoteLogging: process.env.NODE_ENV === 'production',
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
};

/**
 * Creates a logger instance for AI-related operations
 * @param moduleName Name of the module using the logger
 * @returns Logger object with methods for different log levels
 */
export function createAILogger(moduleName: string) {
  // Helper to format timestamp
  const getTimestamp = (): string => {
    return new Date().toISOString();
  };

  // Helper to check if log level should be processed
  const shouldLog = (level: LogLevel): boolean => {
    if (!config.logLevel) return true;
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[config.logLevel];
  };

  // Log to console if enabled
  const logToConsole = (entry: LogEntry): void => {
    if (!config.enableConsole) return;

    const logPrefix = `[${entry.timestamp}] [${entry.module}] [${entry.level.toUpperCase()}]`;
    
    switch (entry.level) {
      case 'debug':
        console.debug(logPrefix, entry.message, entry.data || '');
        break;
      case 'info':
        console.info(logPrefix, entry.message, entry.data || '');
        break;
      case 'warn':
        console.warn(logPrefix, entry.message, entry.data || '');
        break;
      case 'error':
        console.error(logPrefix, entry.message, entry.data || '');
        break;
    }
  };

  // Send log to remote logging service if enabled
  const logToRemote = async (entry: LogEntry): Promise<void> => {
    if (!config.enableRemoteLogging) return;
    
    try {
      // Here you would implement your remote logging
      // For example, sending to an API endpoint or a service like Sentry
      
      // This is a placeholder implementation
      if (typeof window !== 'undefined' && entry.level === 'error') {
        // Example: Only send errors to remote service
        // await fetch('/api/log', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(entry)
        // });
      }
    } catch (error) {
      // Silent fail for logging errors to avoid loops
      console.error('Failed to send log to remote service', error);
    }
  };

  // Generic log method
  const log = (level: LogLevel, message: string, data?: any): void => {
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: getTimestamp(),
      level,
      module: moduleName,
      message,
      data
    };

    logToConsole(entry);
    void logToRemote(entry);
  };

  // Return the logger interface
  return {
    debug: (message: string, data?: any) => log('debug', message, data),
    info: (message: string, data?: any) => log('info', message, data),
    warn: (message: string, data?: any) => log('warn', message, data),
    error: (message: string, data?: any) => log('error', message, data),
    
    // Allow changing configuration at runtime
    setConfig: (newConfig: Partial<LoggerConfig>) => {
      Object.assign(config, newConfig);
    },
    
    // Get current configuration
    getConfig: () => ({ ...config })
  };
}
