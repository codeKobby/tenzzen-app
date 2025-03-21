import { logger } from './debug-logger';

// Gemini rate limits (documented limits with safety margin)
export const RATE_LIMITS = {
  // Model limits
  RPM: 20,                  // Keep under 23 RPM limit for safety
  TPM: 30000,              // Keep under 32k TPM limit for safety
  TPR: 4000,               // Keep under 4096 tokens per request for safety
  
  // Retry configuration
  MAX_RETRIES: 5,          // Maximum retry attempts
  MIN_BACKOFF: 2000,       // Initial backoff in ms
  MAX_BACKOFF: 32000,      // Maximum backoff in ms
  
  // Token estimation
  CHARS_PER_TOKEN: 4       // Approximate characters per token
} as const;

export interface RateLimitInfo {
  requestCount: number;
  tokenCount: number;
  remainingRequests: number;
  remainingTokens: number;
  resetIn: number;
  limits: typeof RATE_LIMITS;
}

export interface ErrorTracking {
  count: number;
  lastError: Error;
}

interface RateLimits {
  remainingRequests: number;
  remainingTokens: number;
  resetIn: number; // milliseconds
}

export class RateLimiter {
  private requestCount: number = 0;
  private tokenCount: number = 0;
  private lastReset: number = Date.now();
  private errorTracker: Map<string, ErrorTracking> = new Map();
  private resetIntervalId: NodeJS.Timeout | null = null;
  
  constructor(
    private readonly requestLimit = RATE_LIMITS.RPM,
    private readonly tokenLimit = RATE_LIMITS.TPM,
    private readonly resetInterval = 60000, // 1 minute default
    private readonly limits = RATE_LIMITS
  ) {
    this.resetCounts = this.resetCounts.bind(this);
    
    // Initialize reset interval
    if (typeof window === 'undefined') {
      // Only set interval on server
      this.resetIntervalId = setInterval(this.resetCounts, this.resetInterval);
    }
  }

  // Clean up when no longer needed
  public dispose(): void {
    if (this.resetIntervalId) {
      clearInterval(this.resetIntervalId);
      this.resetIntervalId = null;
    }
  }

  private resetCounts(): void {
    const now = Date.now();
    if (now - this.lastReset >= this.resetInterval) {
      this.requestCount = 0;
      this.tokenCount = 0;
      this.lastReset = now;
      // Clear old error entries
      this.errorTracker.clear();
      
      logger.debug('api', 'Rate limits reset', {
        time: new Date().toISOString()
      });
    }
  }

  private async rateLimit(tokenEstimate: number = 1000): Promise<void> {
    this.resetCounts();

    // Check token per request limit
    if (tokenEstimate > this.limits.TPR) {
      throw new Error(`Token limit exceeded: ${tokenEstimate} tokens requested, maximum is ${this.limits.TPR}`);
    }

    // Check rate limits
    if (this.requestCount >= this.limits.RPM || 
        this.tokenCount + tokenEstimate >= this.limits.TPM) {
      const waitTime = this.resetInterval - (Date.now() - this.lastReset) + 1000; // Add 1s buffer
      logger.info('api', `Rate limit reached. Waiting ${waitTime}ms before retry...`, {
        requestCount: this.requestCount,
        tokenCount: this.tokenCount,
        tokenEstimate,
        limits: this.limits
      });
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.resetCounts();
    }

    this.requestCount++;
    this.tokenCount += tokenEstimate;

    // Add small delay between requests for better distribution
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private getRequestId(operationId: string, attempt: number): string {
    return `${operationId}-${attempt}-${Date.now()}`;
  }

  async withRetry<T>(
    operation: () => Promise<T>,
    tokenEstimate: number = 1000,
    operationId: string = 'default'
  ): Promise<T> {
    const startTime = Date.now();
    let currentError: Error | null = null;

    for (let attempt = 1; attempt <= this.limits.MAX_RETRIES; attempt++) {
      const requestId = this.getRequestId(operationId, attempt);
      
      try {
        // Check rate limits first
        await this.rateLimit(tokenEstimate);
        
        // Log attempt
        logger.info('api', `Attempt ${attempt}/${this.limits.MAX_RETRIES} for operation ${operationId}`);
        
        // Execute operation
        const result = await operation();

        // Clear error history on success
        this.errorTracker.delete(operationId);

        return result;

      } catch (error) {
        currentError = error instanceof Error ? error : new Error(String(error));
        
        // Track error
        const errorData = this.errorTracker.get(operationId) || { count: 0, lastError: currentError };
        errorData.count++;
        errorData.lastError = currentError;
        this.errorTracker.set(operationId, errorData);
        
        // Log error
        logger.error('api', `Attempt ${attempt} failed:`, currentError);
        
        // Check if we should retry
        if (this.shouldRetry(error)) {
          if (attempt < this.limits.MAX_RETRIES) {
            const backoffTime = this.calculateBackoff(attempt);
            logger.info('api', `Retrying after ${backoffTime}ms (attempt ${attempt}/${this.limits.MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            continue;
          }
        } else {
          // Non-retryable error
          break;
        }
      }
    }

    // If we get here, all retries failed
    const totalTime = Date.now() - startTime;
    const errorInfo = currentError ? {
      message: currentError.message,
      name: currentError.name,
      stack: currentError.stack
    } : 'Unknown error';

    logger.error('api', 'All retry attempts failed:', errorInfo);

    if (!currentError) {
      currentError = new Error('Operation failed after all retries');
    }

    throw currentError;
  }

  private shouldRetry(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('rate') || 
             message.includes('quota') ||
             message.includes('timeout') ||
             message.includes('busy') ||
             message.includes('503') ||
             message.includes('429');
    }
    return false;
  }

  private calculateBackoff(retryCount: number): number {
    // Exponential backoff with full jitter
    const baseDelay = Math.min(
      this.limits.MAX_BACKOFF,
      this.limits.MIN_BACKOFF * Math.pow(2, retryCount - 1)
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.floor(Math.random() * baseDelay * 0.1);
    return Math.min(this.limits.MAX_BACKOFF, baseDelay + jitter);
  }

  getCurrentLimits(): RateLimitInfo {
    this.resetCounts();
    return {
      requestCount: this.requestCount,
      tokenCount: this.tokenCount,
      remainingRequests: Math.max(0, this.limits.RPM - this.requestCount),
      remainingTokens: Math.max(0, this.limits.TPM - this.tokenCount),
      resetIn: Math.max(0, this.resetInterval - (Date.now() - this.lastReset)),
      limits: this.limits
    };
  }

  // Estimate tokens from text
  estimateTokens(text: string): number {
    return Math.ceil(text.length / this.limits.CHARS_PER_TOKEN);
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();