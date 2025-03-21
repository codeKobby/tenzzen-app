import { GoogleGenerativeAIStream, Message, StreamingTextResponse } from 'ai';
import { courseModel } from './index';
import { createEmptyReadableStream } from '@/lib/utils/stream';

interface StreamOptions {
  messages: Message[];
  onStart?: () => Promise<void>;
  onToken?: (token: string) => Promise<void>;
  onFinish?: (completion: string) => Promise<void>;
}

export async function createGoogleAIStream({
  messages,
  onStart,
  onToken,
  onFinish
}: StreamOptions): Promise<Response> {
  try {
    // Prepare chat history for Google AI
    const chatHistory = messages.map(message => ({
      role: message.role,
      parts: [{ text: message.content }]
    }));

    // Start chat and get response
    const chat = courseModel.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 2048
      }
    });

    // Generate response
    const response = await chat.sendMessageStream(
      messages[messages.length - 1].content
    );

    // Call onStart callback if provided
    await onStart?.();

    // Create stream
    const stream = GoogleGenerativeAIStream(response, {
      async onToken(token) {
        await onToken?.(token);
      },
      async onCompletion(completion) {
        await onFinish?.(completion);
      }
    });

    // Return streaming response
    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('Streaming error:', error);
    
    // Return empty stream with error
    const errorStream = createEmptyReadableStream();
    return new StreamingTextResponse(errorStream, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'X-Error': error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}

// Function to generate content with tools
export async function generateStreamingContent(
  prompt: string,
  tools?: any,
  toolChoice?: { type: 'tool'; toolName: string }
): Promise<Response> {
  try {
    const chat = courseModel.startChat({
      tools,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.9,
        maxOutputTokens: 2048
      }
    });

    const response = await chat.sendMessageStream(prompt);

    // Create stream with tool handling
    const stream = GoogleGenerativeAIStream(response, {
      experimental_streamData: true,
      onToolCall: async (call, runManager) => {
        if (!tools || !tools[call.name]) {
          throw new Error(`Tool ${call.name} not found`);
        }

        try {
          // Execute tool and get result
          const result = await tools[call.name].execute(call.arguments);
          
          // Send tool result back to the model
          await runManager.sendToolResult(result, call.name);
          
        } catch (error) {
          console.error(`Tool ${call.name} execution failed:`, error);
          throw error;
        }
      }
    });

    return new StreamingTextResponse(stream);

  } catch (error) {
    console.error('Streaming content generation error:', error);
    const errorStream = createEmptyReadableStream();
    return new StreamingTextResponse(errorStream, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
        'X-Error': error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
}