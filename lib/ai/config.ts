export enum AIErrorCode {
  RateLimit = 'rate_limit',
  TokenLimit = 'token_limit',
  ValidationError = 'validation_error',
  GenerationError = 'generation_error',
  StreamError = 'stream_error',
  Unknown = 'unknown'
}

export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public status: number = 500
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export const AI_CONFIG = {
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  topK: 40,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5,
} as const;
