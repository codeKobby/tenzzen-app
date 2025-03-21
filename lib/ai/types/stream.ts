export type StreamEventType = 'progress' | 'error' | 'tool' | 'finish';

// Base interface for all stream events
export interface BaseStreamEvent {
  type: StreamEventType;
}

// Extended progress event to support UI feedback
export interface ProgressStreamEvent extends BaseStreamEvent {
  type: 'progress';
  progress: number;
  text?: string;
  data?: any; // For additional progress data
}

// Error event with error details
export interface ErrorStreamEvent extends BaseStreamEvent {
  type: 'error';
  error: string;
}

// Tool event for AI actions
export interface ToolStreamEvent extends BaseStreamEvent {
  type: 'tool';
  toolName: string;
  result: string;
}

// Finish event to signal completion
export interface FinishStreamEvent extends BaseStreamEvent {
  type: 'finish';
}

// Union type of all possible stream events
export type StreamEvent = 
  | ProgressStreamEvent 
  | ErrorStreamEvent 
  | ToolStreamEvent 
  | FinishStreamEvent;

// The format of stream events according to Vercel AI SDK
export const StreamProtocolTypes = {
  text: 0,            // text/progress response
  data: 1,           // data response
  error: 2,          // error response
  tool: 3,           // tool call/response
  finish: 4          // completion signal
} as const;

// Type for progress callbacks used in components
export type ProgressCallback = (event: {
  type: 'start' | 'progress' | 'done';
  progress?: number;
  data?: any;
}) => Promise<void>;

// Helper functions to create stream events
export const createStreamEvent = {
  progress: (progress: number, text?: string, data?: any): ProgressStreamEvent => ({
    type: 'progress',
    progress,
    text,
    data
  }),
  
  error: (error: string): ErrorStreamEvent => ({
    type: 'error',
    error
  }),
  
  tool: (toolName: string, result: string): ToolStreamEvent => ({
    type: 'tool',
    toolName,
    result
  }),
  
  finish: (): FinishStreamEvent => ({
    type: 'finish'
  })
};

// Convert between UI progress callback events and stream events
export function convertProgressEvent(event: StreamEvent): Parameters<ProgressCallback>[0] {
  if (event.type === 'progress') {
    return {
      type: 'progress',
      progress: event.progress,
      data: event.data
    };
  } else if (event.type === 'finish') {
    return {
      type: 'done',
      progress: 100
    };
  } else if (event.type === 'error') {
    return {
      type: 'done',
      progress: 0,
      data: { error: event.error }
    };
  }
  
  return {
    type: 'progress',
    progress: 50 // Default progress for other events
  };
}

// Helper to format stream events according to protocol
export function formatStreamEvent(event: StreamEvent): string {
  switch (event.type) {
    case 'progress':
      return `${StreamProtocolTypes.text}:${JSON.stringify({
        progress: event.progress,
        text: event.text,
        data: event.data
      })}\n`;
      
    case 'error':
      return `${StreamProtocolTypes.error}:${JSON.stringify({
        error: event.error
      })}\n`;
      
    case 'tool':
      return `${StreamProtocolTypes.tool}:${JSON.stringify({
        toolName: event.toolName,
        result: event.result
      })}\n`;
      
    case 'finish':
      return `${StreamProtocolTypes.finish}:{}\n`;
      
    default:
      throw new Error('Unknown event type');
  }
}

// Type guards for event checking
export const isProgressEvent = (event: StreamEvent): event is ProgressStreamEvent =>
  event.type === 'progress';

export const isErrorEvent = (event: StreamEvent): event is ErrorStreamEvent =>
  event.type === 'error';

export const isToolEvent = (event: StreamEvent): event is ToolStreamEvent =>
  event.type === 'tool';

export const isFinishEvent = (event: StreamEvent): event is FinishStreamEvent =>
  event.type === 'finish';
