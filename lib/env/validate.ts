import { logger } from "@/lib/ai/debug-logger";

const ENV_SCHEMA = {
  required: [
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'YOUTUBE_API_KEY'
  ],
  optional: {
    GOOGLE_GENERATIVE_AI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
    NODE_ENV: 'development'
  }
} as const;

type ValidateResult = {
  isValid: boolean;
  missing: string[];
  invalid: string[];
};

export function validateEnvironment(nodeEnv: 'development' | 'production'): ValidateResult {
  const missing: string[] = [];
  const invalid: string[] = [];

  // Check required variables
  for (const key of ENV_SCHEMA.required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check optional variables with defaults
  for (const [key, defaultValue] of Object.entries(ENV_SCHEMA.optional)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }

  // Additional validation for production
  if (nodeEnv === 'production') {
    // Add any production-specific validation here
    if (process.env.NODE_ENV !== 'production') {
      invalid.push('NODE_ENV must be "production" in production environment');
    }
  }

  const isValid = missing.length === 0 && invalid.length === 0;

  if (!isValid) {
    logger.error('state', 'Environment validation failed', {
      missing,
      invalid,
      nodeEnv
    });
  }

  return {
    isValid,
    missing,
    invalid
  };
}