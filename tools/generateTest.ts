import { logger } from '@/lib/ai/debug-logger';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';

// Schema for question generation
const questionSchema = z.object({
  question: z.string(),
  type: z.enum(['multiple-choice', 'written']),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
  explanation: z.string()
});

export type Question = z.infer<typeof questionSchema>;

const googleModel = google('gemini-1.5-pro-latest', {
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ]
});

export interface TestGenerationParams {
  content: string;
  questionCount?: number;
  types?: ('multiple-choice' | 'written')[];
  temperature?: number;
}

export async function generateTest({
  content,
  questionCount = 5,
  types = ['multiple-choice', 'written'],
  temperature = 0.7
}: TestGenerationParams) {
  try {
    const result = await generateText({
      model: googleModel,
      maxTokens: 2048,
      temperature,
      messages: [{
        role: 'user',
        content: `
Generate ${questionCount} test questions based on this content:

${content}

Guidelines:
1. Mix ${types.join(' and ')} questions
2. For multiple choice:
   - Include 4-5 plausible options
   - One clear correct answer
   - Each option should be distinct
3. For written questions:
   - Target key concepts
   - Require explanation or analysis
4. Include explanation for each answer
5. Vary difficulty levels
`
      }],
      tools: {
        generateQuestions: {
          description: "Generate test questions from content",
          parameters: z.array(questionSchema)
        }
      },
      toolChoice: {
        type: 'tool',
        toolName: 'generateQuestions'
      }
    });

    if (!result.toolCalls?.[0]?.args) {
      throw new Error('No questions generated');
    }

    // Parse and validate questions
    const questions = z.array(questionSchema).parse(result.toolCalls[0].args);

    logger.info('state', 'Test questions generated', {
      count: questions.length,
      types: questions.map(q => q.type)
    });

    return {
      title: 'Knowledge Check',
      description: 'Test your understanding of the key concepts covered',
      questionCount: questions.length,
      questionTypes: Array.from(new Set(questions.map(q => q.type))),
      estimatedDuration: `${Math.ceil(questions.length * 5)} minutes`,
      questions
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Test generation failed');
    logger.error('api', err.message, { error: err });
    throw err;
  }
}