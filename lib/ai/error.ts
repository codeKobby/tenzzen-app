import { logger } from './debug-logger';
import { toast } from 'sonner';

// Extend error messages with API-specific codes
export const ERROR_CODES = {
  // General errors
  unknown: 'An unexpected error occurred.',
  network: 'Network error. Please check your connection.',
  timeout: 'Request timed out. Please try again.',
  cancelled: 'Operation was cancelled.',
  
  // Authentication and configuration
  configuration: 'Invalid configuration.',
  authentication: 'Authentication failed.',
  initialization: 'Failed to initialize AI service.',
  
  // Rate limiting
  rateLimit: 'Rate limit exceeded. Please try again in a moment.',
  quotaExceeded: 'API quota exceeded.',
  
  // Validation errors
  validationFailed: 'Validation failed.',
  invalidRequest: 'Invalid request format.',
  invalidResponse: 'Received invalid response from AI.',
  parseError: 'Failed to parse response.',
  
  // Content errors
  safety: 'Content safety check failed.',
  contextLimit: 'Input too long. Please try with shorter content.',
  noTranscript: 'Could not extract video transcript.',
  emptyResponse: 'Received empty response from AI model.',
  
  // Generation errors
  generationFailed: 'Failed to generate content.',
  contentBlocked: 'Content generation was blocked.'
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;

export class AIError extends Error {
  public code: ErrorCode;
  public details?: Record<string, unknown>;
  public status?: number;

  constructor(
    code: ErrorCode,
    details?: Record<string, unknown>,
    status?: number
  ) {
    super(ERROR_CODES[code]);
    this.name = 'AIError';
    this.code = code;
    this.details = details;
    this.status = status;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, AIError.prototype);
  }

  static fromError(error: unknown): AIError {
    if (error instanceof AIError) {
      return error;
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'AbortError') {
        return new AIError('cancelled', { originalError: error });
      }

      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        return new AIError('rateLimit', { originalError: error });
      }

      if (error.message.includes('timeout')) {
        return new AIError('timeout', { originalError: error });
      }

      if (error.message.includes('safety')) {
        return new AIError('safety', { originalError: error });
      }

      // Generic error conversion
      return new AIError('unknown', { originalError: error });
    }

    // Handle non-Error objects
    return new AIError('unknown', { originalValue: error });
  }
}

interface ErrorHandlerOptions {
  silent?: boolean;
  retry?: () => Promise<void>;
  onError?: (error: AIError) => void;
}

export async function handleError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): Promise<void> {
  const aiError = AIError.fromError(error);

  // Log the error
  logger.error('api', ERROR_CODES[aiError.code], aiError, aiError.details);

  // Show user notification if not silent
  if (!options.silent) {
    toast.error(ERROR_CODES[aiError.code], {
      description: aiError.details?.message as string,
      action: options.retry ? {
        label: 'Retry',
        onClick: () => options.retry?.()
      } : undefined
    });
  }

  // Call custom error handler if provided
  options.onError?.(aiError);
}

export function createAIError(
  code: ErrorCode,
  details?: Record<string, unknown>,
  status?: number
): AIError {
  return new AIError(code, details, status);
}

export function createErrorResponse(
  codeOrError: ErrorCode | AIError,
  status: number = 500,
  details?: Record<string, unknown>
): Response {
  const error = codeOrError instanceof AIError
    ? codeOrError
    : createAIError(codeOrError, details, status);

  return new Response(
    JSON.stringify({
      error: ERROR_CODES[error.code],
      code: error.code,
      details: error.details
    }),
    {
      status: error.status || status,
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
}

export function isAIError(error: unknown): error is AIError {
  return error instanceof AIError;
}

export function getErrorMessage(error: unknown): string {
  const aiError = AIError.fromError(error);
  return ERROR_CODES[aiError.code];
}

export function getErrorCode(error: unknown): ErrorCode {
  if (isAIError(error)) {
    return error.code;
  }
  return 'unknown';
}

// React error boundary handler
export function handleBoundaryError(error: Error) {
  const aiError = AIError.fromError(error);
  logger.error('ui', 'Error boundary caught error', aiError, {
    componentStack: error.stack
  });
}

// Export types
export type { ErrorHandlerOptions };