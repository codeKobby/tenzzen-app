import type { StreamEvent } from '@/lib/ai/types/stream';
import { formatStreamEvent } from '@/lib/ai/types/stream';

export function createEncodedStream(stream: ReadableStream<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return stream.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(encoder.encode(chunk));
    },
  }));
}

export function createEventStream<T>(
  processor: (data: T) => StreamEvent | null,
  onProgress?: (event: StreamEvent) => Promise<void>
): TransformStream<T, Uint8Array> {
  const encoder = new TextEncoder();
  
  return new TransformStream({
    async transform(chunk, controller) {
      try {
        const event = processor(chunk);
        if (event) {
          const encoded = encoder.encode(formatStreamEvent(event));
          controller.enqueue(encoded);
          
          if (onProgress) {
            await onProgress(event);
          }
        }
      } catch (error) {
        // Log error but don't stop stream
        console.error('Stream processing error:', error);
        
        // Send error event
        const errorEvent: StreamEvent = {
          type: 'error',
          error: error instanceof Error ? error.message : 'Stream processing failed'
        };
        controller.enqueue(encoder.encode(formatStreamEvent(errorEvent)));
      }
    },
    async flush(controller) {
      const finishEvent: StreamEvent = { type: 'finish' };
      controller.enqueue(encoder.encode(formatStreamEvent(finishEvent)));
    }
  });
}

export function createDataStream<T>(events: AsyncIterable<T> | Iterable<T>): ReadableStream<T> {
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(event);
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

export function mergeStreams<T>(...streams: ReadableStream<T>[]): ReadableStream<T> {
  return new ReadableStream({
    async start(controller) {
      try {
        await Promise.all(streams.map(async (stream) => {
          const reader = stream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        }));
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
}

// Utility function to handle decoding stream chunks
export function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const decoder = new TextDecoder();
  let result = '';
  return new Promise((resolve, reject) => {
    const reader = stream.getReader();
    function read() {
      reader.read().then(({done, value}) => {
        if (done) {
          resolve(result);
          return;
        }
        result += decoder.decode(value, { stream: true });
        read();
      }).catch(reject);
    }
    read();
  });
}

// Helper to accumulate stream chunks into a complete message
export class StreamChunkAccumulator {
  private buffer = '';
  private readonly decoder = new TextDecoder();

  append(chunk: Uint8Array): string | null {
    this.buffer += this.decoder.decode(chunk, { stream: true });
    try {
      const result = JSON.parse(this.buffer);
      this.buffer = '';
      return result;
    } catch {
      return null;
    }
  }

  clear(): void {
    this.buffer = '';
  }

  getBuffer(): string {
    return this.buffer;
  }
}
