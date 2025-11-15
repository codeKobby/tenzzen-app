interface MessageBase {
  type: 'progress' | 'tool-result' | 'error' | 'finish';
}

interface ProgressMessage extends MessageBase {
  type: 'progress';
  progress: number;
}

interface ToolResultMessage extends MessageBase {
  type: 'tool-result';
  toolName: string;
  result: any;
}

interface ErrorMessage extends MessageBase {
  type: 'error';
  error: string;
}

interface FinishMessage extends MessageBase {
  type: 'finish';
}

export type StreamMessage = 
  | ProgressMessage
  | ToolResultMessage
  | ErrorMessage
  | FinishMessage;

export class StreamHandler {
  private writer: WritableStreamDefaultWriter;
  private encoder: TextEncoder;

  constructor(stream: WritableStream, encoder: TextEncoder) {
    this.writer = stream.getWriter();
    this.encoder = encoder;
  }

  async writeMessage(message: StreamMessage): Promise<void> {
    await this.writer.write(
      this.encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
    );
  }

  async progress(progress: number): Promise<void> {
    await this.writeMessage({ type: 'progress', progress });
  }

  async toolResult(toolName: string, result: any): Promise<void> {
    await this.writeMessage({ type: 'tool-result', toolName, result });
  }

  async error(error: string): Promise<void> {
    await this.writeMessage({ type: 'error', error });
  }

  async finish(): Promise<void> {
    await this.writeMessage({ type: 'finish' });
  }

  async close(): Promise<void> {
    await this.writer.close();
  }
}

export function createStreamResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}