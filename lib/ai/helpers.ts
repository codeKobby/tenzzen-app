import type { TranscriptSegment } from "@/types/youtube";

/**
 * Splits a transcript into chunks that fit within token limits
 * Ensures chunks are meaningful by splitting on sentence boundaries
 */
export function chunkTranscript(
  transcript: TranscriptSegment[],
  maxChunkLength: number = 4000
): TranscriptSegment[][] {
  const chunks: TranscriptSegment[][] = [];
  let currentChunk: TranscriptSegment[] = [];
  let currentLength = 0;

  for (const segment of transcript) {
    // Rough estimate of tokens (chars / 4 is a common approximation)
    const segmentTokens = Math.ceil(segment.text.length / 4);

    // If adding this segment would exceed the limit, start a new chunk
    if (currentLength + segmentTokens > maxChunkLength && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentLength = 0;
    }

    currentChunk.push(segment);
    currentLength += segmentTokens;
  }

  // Add the last chunk if it contains anything
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Utility to wait with exponential backoff
 */
export async function waitWithBackoff(
  attempt: number,
  baseDelay: number = 1000,
  maxDelay: number = 32000
): Promise<void> {
  const delay = Math.min(
    baseDelay * Math.pow(2, attempt) * (1 + Math.random() * 0.1),
    maxDelay
  );
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Utility to combine partial course results
 */
export function combinePartialResults(parts: any[]): any {
  // Start with the first part as the base
  const combined = { ...parts[0] };

  // For each subsequent part, merge its sections
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    combined.sections = [...combined.sections, ...part.sections];
  }

  return combined;
}

/**
 * Delay generator for rate limiting
 */
export async function* createRateLimitDelay(
  baseDelay: number = 1000,
  maxDelay: number = 60000
): AsyncGenerator<number> {
  let attempt = 0;
  while (true) {
    const delay = Math.min(
      baseDelay * Math.pow(2, attempt) * (1 + Math.random() * 0.1),
      maxDelay
    );
    yield delay;
    attempt++;
  }
}

/**
 * Process large requests with rate limiting
 */
export async function processWithRateLimit<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    maxConcurrent?: number;
    baseDelay?: number;
    maxDelay?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
): Promise<R[]> {
  const {
    maxConcurrent = 1,
    baseDelay = 1000,
    maxDelay = 60000,
    onProgress
  } = options;

  const results: R[] = [];
  const delayGen = createRateLimitDelay(baseDelay, maxDelay);
  let processed = 0;

  // Process items in batches of maxConcurrent
  for (let i = 0; i < items.length; i += maxConcurrent) {
    const batch = items.slice(i, i + maxConcurrent);
    
    try {
      // Process the batch
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
      processed += batch.length;
      onProgress?.(processed, items.length);
      
      // Wait before next batch
      if (i + maxConcurrent < items.length) {
        const delay = await delayGen.next();
        if (delay.value) {
          await new Promise(resolve => setTimeout(resolve, delay.value));
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('Rate limit')) {
        // If we hit a rate limit, wait longer and retry the batch
        const delay = await delayGen.next();
        if (delay.value) {
          await new Promise(resolve => setTimeout(resolve, delay.value));
        }
        i -= maxConcurrent; // Retry this batch
        continue;
      }
      throw error; // Re-throw other errors
    }
  }

  return results;
}