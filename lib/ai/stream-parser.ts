import { StreamEvent, StreamProtocolTypes } from './types/stream';

interface RawStreamEvent {
  type: number;
  value: string;
}

function parseStreamLine(line: string): RawStreamEvent | null {
  // Format is "TYPE_ID:CONTENT_JSON\n"
  const match = line.match(/^(\d+):(.+)$/);
  if (!match) return null;

  const [, type, value] = match;
  return {
    type: parseInt(type, 10),
    value
  };
}

function convertStreamEvent(raw: RawStreamEvent): StreamEvent | null {
  try {
    const data = JSON.parse(raw.value);
    
    switch (raw.type) {
      case StreamProtocolTypes.text:
        return {
          type: 'progress',
          progress: data.progress || 0,
          text: data.text || 'Processing...'
        };

      case StreamProtocolTypes.error:
        return {
          type: 'error',
          error: data.error || 'Unknown error occurred'
        };

      case StreamProtocolTypes.tool:
        if (!data.toolName) return null;
        return {
          type: 'tool',
          toolName: data.toolName,
          result: data.result || ''
        };

      case StreamProtocolTypes.finish:
        return {
          type: 'finish'
        };

      default:
        console.warn('Unknown stream event type:', raw.type);
        return null;
    }
  } catch (error) {
    console.warn('Failed to parse stream event:', error);
    return null;
  }
}

export function parseStreamChunk(chunk: Uint8Array): StreamEvent[] {
  const text = new TextDecoder().decode(chunk);
  const lines = text.split('\n').filter(line => line.trim());
  
  return lines
    .map(line => parseStreamLine(line))
    .filter((raw): raw is RawStreamEvent => raw !== null)
    .map(raw => convertStreamEvent(raw))
    .filter((event): event is StreamEvent => event !== null);
}

export function validateStreamResult(event: unknown): StreamEvent {
  if (!event || typeof event !== 'object') {
    throw new Error('Invalid event data');
  }

  const evt = event as any;
  if (!evt.type || typeof evt.type !== 'string') {
    throw new Error('Invalid event type');
  }

  switch (evt.type) {
    case 'progress':
      if (typeof evt.progress !== 'number' || evt.progress < 0 || evt.progress > 100) {
        throw new Error('Invalid progress value');
      }
      if (evt.text && typeof evt.text !== 'string') {
        throw new Error('Invalid progress text');
      }
      return evt;

    case 'error':
      if (!evt.error || typeof evt.error !== 'string') {
        throw new Error('Invalid error message');
      }
      return evt;

    case 'tool':
      if (!evt.toolName || typeof evt.toolName !== 'string') {
        throw new Error('Invalid tool name');
      }
      if (typeof evt.result !== 'string') {
        throw new Error('Invalid tool result');
      }
      return evt;

    case 'finish':
      return evt;

    default:
      throw new Error(`Unknown event type: ${evt.type}`);
  }
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Extract useful information from the error
    if (!error.message) return 'An unknown error occurred';
    
    const message = error.message.includes('Error:')
      ? error.message.split('Error:')[1].trim()
      : error.message;
      
    // Add additional context if available
    if (error.cause) {
      return `${message} - ${formatErrorMessage(error.cause)}`;
    }

    return message.charAt(0).toUpperCase() + message.slice(1);
  }

  if (typeof error === 'string') {
    const message = error.includes('Error:')
      ? error.split('Error:')[1].trim()
      : error;
    return message.charAt(0).toUpperCase() + message.slice(1);
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return formatErrorMessage((error as { message: unknown }).message);
  }

  return 'An unknown error occurred';
}

// Helper for type checking stream events
export const isStreamEvent = {
  progress: (event: StreamEvent): event is StreamEvent & { type: 'progress' } =>
    event.type === 'progress',
  error: (event: StreamEvent): event is StreamEvent & { type: 'error' } =>
    event.type === 'error',
  tool: (event: StreamEvent): event is StreamEvent & { type: 'tool' } =>
    event.type === 'tool',
  finish: (event: StreamEvent): event is StreamEvent & { type: 'finish' } =>
    event.type === 'finish'
};
