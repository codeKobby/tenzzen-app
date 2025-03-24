type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'api' | 'state' | 'ai' | 'transcript' | 'course-generation' | 'quiz-generation' | 'project-generation';

interface LogData {
  [key: string]: any;
}

// Simple debug logger for AI operations
export const logger = {
  debug: (category: LogCategory, message: string, data?: LogData) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG:${category}] ${message}`, data || '');
    }
  },
  
  info: (category: LogCategory, message: string, data?: LogData) => {
    console.info(`[INFO:${category}] ${message}`, data || '');
  },
  
  warn: (category: LogCategory, message: string, data?: LogData) => {
    console.warn(`[WARN:${category}] ${message}`, data || '');
  },
  
  error: (category: LogCategory, message: string, data?: LogData) => {
    console.error(`[ERROR:${category}] ${message}`, data || '');
    
    // In production, you might want to send errors to a monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to error monitoring service (if configured)
      try {
        if (typeof window !== 'undefined' && (window as any).sentryCapture) {
          (window as any).sentryCapture({
            level: 'error',
            category,
            message,
            data
          });
        }
      } catch (e) {
        // Ignore errors in error reporting
      }
    }
  }
};