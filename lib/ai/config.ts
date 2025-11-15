import { google } from "@ai-sdk/google";

// Ensure API key is available - Google SDK reads from GOOGLE_GENERATIVE_AI_API_KEY automatically
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.error("Warning: GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables");
}

export const aiConfig = {
  // API configuration
  apiKey,

  // Model selection - using Gemini models
  models: {
    default: process.env.AI_MODEL_DEFAULT || "gemini-1.5-flash",
    fast: process.env.AI_MODEL_FAST || "gemini-1.5-flash",
    smart: process.env.AI_MODEL_SMART || "gemini-1.5-pro",
  },

  // Generation parameters
  parameters: {
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "8192"),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.7"),
    topP: 0.9,
  },

  // Feature flags
  features: {
    streaming: true,
    functionCalling: true,
  },
} as const;

// Provider instances - Google SDK automatically uses GOOGLE_GENERATIVE_AI_API_KEY env var
export const getModel = (type: "default" | "fast" | "smart" = "default") => {
  return google(aiConfig.models[type]);
};
