import { createGoogleGenerativeAI } from "@ai-sdk/google";

// Ensure API key is available
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

if (!apiKey) {
  console.error("Warning: GOOGLE_GENERATIVE_AI_API_KEY is not set in environment variables");
}

// Create Google AI provider instance
const google = createGoogleGenerativeAI({
  apiKey: apiKey,
});

export const aiConfig = {
  // API configuration
  apiKey,

  // Model selection - using Gemini 2.5 Flash model
  // gemini-2.5-flash: Latest stable model with 1M token context window and enhanced capabilities
  models: {
    default: process.env.AI_MODEL_DEFAULT || "models/gemini-2.5-flash",
    fast: process.env.AI_MODEL_FAST || "models/gemini-2.5-flash", 
    smart: process.env.AI_MODEL_SMART || "models/gemini-2.5-flash",
  },

  // Generation parameters - matching old ADK service settings
  parameters: {
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "8192"),
    temperature: parseFloat(process.env.AI_TEMPERATURE || "0.2"), // Lower temperature for consistency
    topP: 0.95,
    topK: 40,
  },

  // Feature flags
  features: {
    streaming: true,
    functionCalling: true,
  },
} as const;

// Provider instances - Return language model from Google provider
export const getModel = (type: "default" | "fast" | "smart" = "default") => {
  return google.languageModel(aiConfig.models[type]);
};
