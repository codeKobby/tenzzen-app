interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
}

/**
 * Create a logger instance with a specific context name
 */
export function createLogger(context: string): Logger {
  const prefix = `[${context}]`;
  
  return {
    log: (...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(prefix, ...args);
      }
    },
    warn: (...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(prefix, ...args);
      }
    },
    error: (...args: any[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.error(prefix, ...args);
      }
    }
  };
}
