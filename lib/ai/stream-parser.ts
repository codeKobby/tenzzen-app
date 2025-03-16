interface StreamEvent {
  type: 'start' | 'finish' | 'error' | 'tool-result' | 'progress';
  error?: string;
  toolName?: string;
  result?: any;
  progress?: number;
}

export function parseStreamChunk(chunk: Uint8Array): StreamEvent[] {
  try {
    const decoder = new TextDecoder();
    const text = decoder.decode(chunk);
    console.log('Raw chunk:', text);

    // Split into individual SSE events
    const events = text
      .split('\n\n')
      .filter(Boolean)
      .map(event => event.replace(/^data: /, ''))
      .filter(Boolean);

    console.log('Parsed events:', events);

    // Parse each event into a structured object
    return events.map(event => {
      try {
        const data = JSON.parse(event);
        
        // Validate event structure
        if (!data.type) {
          console.warn('Event missing type:', data);
          throw new Error('Invalid event format');
        }

        console.log(`Parsed ${data.type} event:`, data);
        return data as StreamEvent;
      } catch (e) {
        console.error('Failed to parse event:', event, e);
        return {
          type: 'error',
          error: 'Failed to parse event data'
        };
      }
    });
  } catch (e) {
    console.error('Failed to decode chunk:', e);
    return [{
      type: 'error',
      error: 'Failed to decode stream chunk'
    }];
  }
}

export function validateStreamResult(data: any) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid stream result: not an object');
  }

  const requiredFields = ['type', 'result'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new Error(`Invalid stream result: missing ${field}`);
    }
  }

  if (data.type === 'tool-result' && !data.toolName) {
    throw new Error('Invalid tool result: missing toolName');
  }

  if (data.type === 'error' && !data.error) {
    throw new Error('Invalid error result: missing error message');
  }

  return data;
}

export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  
  return 'An unknown error occurred';
}