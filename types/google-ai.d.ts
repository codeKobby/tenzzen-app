declare module '@google/generative-ai' {
  interface GenerationConfig {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    candidateCount?: number;
    stopSequences?: string[];
  }

  interface SafetySetting {
    category: string;
    threshold: string;
  }

  interface GenerateContentRequest {
    contents: Array<{
      role: string;
      parts: Array<{
        text: string;
      }>;
    }>;
  }

  interface GenerateContentOptions {
    signal?: AbortSignal;
    generationConfig?: GenerationConfig;
    safetySettings?: SafetySetting[];
  }

  interface ContentCandidate {
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }

  interface StreamResponse {
    stream: AsyncIterable<{
      text(): string;
    }>;
  }

  interface ModelOptions {
    model: string;
    generationConfig?: GenerationConfig;
    safetySettings?: SafetySetting[];
  }

  class GenerativeModel {
    constructor(options: ModelOptions);

    generateContent(
      request: GenerateContentRequest | string,
      options?: GenerateContentOptions
    ): Promise<{
      response: ContentCandidate;
    }>;

    generateContentStream(
      request: GenerateContentRequest | string,
      options?: GenerateContentOptions
    ): Promise<StreamResponse>;
  }

  class GoogleGenerativeAI {
    constructor(apiKey: string);

    getGenerativeModel(options: ModelOptions): GenerativeModel;
  }

  export { GoogleGenerativeAI, type GenerativeModel, type GenerationConfig };
}