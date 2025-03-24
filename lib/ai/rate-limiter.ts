/**
 * Rate limiting utility for AI API calls
 */
import { logger } from './debug-logger';

interface RequestMetadata {
  timestamp: number;
  tokens: number;
}

interface RetryOptions {
  maxRetries?: number;
  backoffFactor?: number;
  initialDelay?: number;
}

class RateLimiter {
  private recentRequests: RequestMetadata[] = [];
  private maxRequestsPerMinute: number = 10;
  private maxTokensPerMinute: number = 100_000;
  private waitQueue: Array<{
    resolve: () => void;
    tokens: number;
  }> = [];
  private processingQueue: boolean = false;
  private windowSize: number = 60 * 1000; // 1 minute in milliseconds

  constructor() {
    // Clean up old requests periodically
    setInterval(() => this.cleanupOldRequests(), 10000);
  }

  private cleanupOldRequests(): void {
    const now = Date.now();
    const cutoff = now - this.windowSize;
    this.recentRequests = this.recentRequests.filter(req => req.timestamp > cutoff);
  }

  private getCurrentTokenUsage(): number {
    this.cleanupOldRequests();
    return this.recentRequests.reduce((sum, req) => sum + req.tokens, 0);
  }

  private getCurrentRequestCount(): number {
    this.cleanupOldRequests();
    return this.recentRequests.length;
  }

  private async processQueue(): Promise<void> {
    if (this.processingQueue) return;
    this.processingQueue = true;

    while (this.waitQueue.length > 0) {
      const requestCount = this.getCurrentRequestCount();
      const tokenCount = this.getCurrentTokenUsage();

      if (
        requestCount < this.maxRequestsPerMinute &&
        tokenCount < this.maxTokensPerMinute
      ) {
        const nextRequest = this.waitQueue.shift();
        if (nextRequest) {
          nextRequest.resolve();
          // Add a small delay to prevent race conditions
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      } else {
        // Wait and check again
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.processingQueue = false;
  }

  public async waitForAvailability(tokens: number): Promise<void> {
    return new Promise<void>(resolve => {
      const requestCount = this.getCurrentRequestCount();
      const tokenCount = this.getCurrentTokenUsage();

      if (
        requestCount < this.maxRequestsPerMinute &&
        tokenCount + tokens < this.maxTokensPerMinute
      ) {
        // Can process immediately
        resolve();
      } else {
        // Need to wait
        logger.debug('rate-limiter', `Rate limit hit, waiting in queue for ${tokens} tokens`);
        this.waitQueue.push({ resolve, tokens });
        this.processQueue();
      }
    });
  }

  public recordRequest(tokens: number): void {
    this.recentRequests.push({
      timestamp: Date.now(),
      tokens
    });
  }

  // Helper to estimate tokens from text length (rough approximation)
  public estimateTokens(text: string): number {
    if (!text) return 0;
    // Simple estimation: ~1 token per 4 characters
    return Math.ceil(text.length / 4);
  }

  // Combined function to wait and record
  public async withRateLimit<T>(
    fn: () => Promise<T>,
    estimatedTokens: number
  ): Promise<T> {
    await this.waitForAvailability(estimatedTokens);
    try {
      const result = await fn();
      this.recordRequest(estimatedTokens);
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Retry with exponential backoff
  public async withRetry<T>(
    fn: () => Promise<T>,
    estimatedTokens: number,
    context: string = 'unknown',
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      backoffFactor = 2,
      initialDelay = 1000
    } = options;

    let retries = 0;
    let lastError: any = null;

    while (retries <= maxRetries) {
      try {
        if (retries > 0) {
          logger.info('rate-limiter', `Retry ${retries}/${maxRetries} for ${context}`);
        }

        return await this.withRateLimit(fn, estimatedTokens);
      } catch (error) {
        lastError = error;
        retries++;

        if (retries <= maxRetries) {
          const delay = initialDelay * Math.pow(backoffFactor, retries - 1);
          logger.warn('rate-limiter', `Request failed, retrying in ${delay}ms`, { error, context, retry: retries });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('rate-limiter', `All retries failed for ${context}`, lastError);
    throw lastError;
  }
}

export const rateLimiter = new RateLimiter();

export default rateLimiter;