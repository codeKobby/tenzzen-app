type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'state' | 'api' | 'google' | 'stream' | 'ui';

interface LogOptions {
  level: LogLevel;
  timestamp: Date;
  category: LogCategory;
  message: string;
  data?: any;
}

class Logger {
  private isProduction: boolean;
  
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }
  
  private log({ level, category, message, data, timestamp }: LogOptions) {
    // Always log errors regardless of environment
    if (level === 'error' || !this.isProduction) {
      const time = timestamp.toISOString();
      const prefix = `[${time}] [${level.toUpperCase()}] [${category}]`;
      
      if (level === 'error') {
        if (data instanceof Error) {
          console.error(`${prefix} ${message}`, {
            error: {
              message: data.message,
              stack: data.stack,
              name: data.name
            }
          });
        } else {
          console.error(`${prefix} ${message}`, data);
        }
      } else if (level === 'warn') {
        console.warn(`${prefix} ${message}`, data);
      } else if (level === 'info') {
        console.info(`${prefix} ${message}`, data);
      } else {
        console.debug(`${prefix} ${message}`, data);
      }
    }
  }

  logObject(level: LogLevel, category: LogCategory, message: string, obj: any) {
    try {
      // Safely stringify complex objects
      const safeObj = this.safeStringify(obj);
      this.log({
        level,
        category,
        message: `${message} - ${safeObj}`,
        timestamp: new Date()
      });
    } catch (e) {
      this.error(category, `Failed to log object: ${message}`, e);
    }
  }

  private safeStringify(obj: any, indent: number = 2): string {
    try {
      // Handle circular references in objects
      const cache: any[] = [];
      return JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (cache.includes(value)) {
            return '[Circular Reference]';
          }
          cache.push(value);
        }
        return value;
      }, indent);
    } catch (e) {
      return `[Object cannot be stringified: ${e instanceof Error ? e.message : String(e)}]`;
    }
  }
  
  debug(category: LogCategory, message: string, data?: any) {
    this.log({
      level: 'debug',
      category,
      message,
      data,
      timestamp: new Date()
    });
  }
  
  info(category: LogCategory, message: string, data?: any) {
    this.log({
      level: 'info',
      category,
      message,
      data,
      timestamp: new Date()
    });
  }
  
  warn(category: LogCategory, message: string, data?: any) {
    this.log({
      level: 'warn',
      category,
      message,
      data,
      timestamp: new Date()
    });
  }
  
  error(category: LogCategory, message: string, error: any) {
    this.log({
      level: 'error',
      category,
      message,
      data: error,
      timestamp: new Date()
    });
  }
}

export const logger = new Logger();