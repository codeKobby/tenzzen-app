import { logger } from '@/lib/ai/debug-logger';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { fetchResources } from './fetchResources';

// Schema for assignment tasks
const taskSchema = z.object({
  title: z.string(),
  description: z.string(),
  objective: z.string(), // What was just learned
  acceptance: z.array(z.string()), // Quick checkpoints
  timeEstimate: z.string(), // Short time estimate (5-10 min)
  hint: z.string().optional(),
  relatedContent: z.string() // Reference to specific lesson/timestamp
});

export type Task = z.infer<typeof taskSchema>;

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

export interface AssignmentParams {
  content: string;
  skills: string[];
  taskCount?: number;
  temperature?: number;
}

export async function generateAssignment({
  content,
  skills,
  taskCount = 3,
  temperature = 0.7
}: AssignmentParams) {
  try {
    const result = await generateText({
      model: googleModel,
      maxTokens: 2048,
      temperature,
      messages: [{
        role: 'user',
        content: `
Create quick hands-on practice tasks based on what was just covered:

${content}

Key Points:
${skills.join('\n')}

Guidelines:
1. Create ${taskCount} short practice tasks
2. Each task should:
   - Focus on what was just learned
   - Take 5-10 minutes to complete
   - Include quick checkpoints
   - Reference specific parts of the lesson
3. Keep it simple and direct
4. Use video timestamps for references
5. Include description links when relevant
`
      }],
      tools: {
        generateTasks: {
          description: "Generate practical assignment tasks",
          parameters: z.array(taskSchema)
        }
      },
      toolChoice: {
        type: 'tool',
        toolName: 'generateTasks'
      }
    });

    if (!result.toolCalls?.[0]?.args) {
      throw new Error('No tasks generated');
    }

    // Parse and validate tasks
    const tasks = z.array(taskSchema).parse(result.toolCalls[0].args);

    // Fetch relevant resources
    const resources = await fetchResources({
      content,
      description: `Resources needed for: ${tasks.map(t => t.title).join(', ')}`,
      maxResults: 3
    });

    logger.info('state', 'Assignment tasks generated', {
      count: tasks.length,
      skills,
      resourceCount: resources.length
    });

    return {
      title: 'Quick Practice',
      description: 'Short hands-on exercises from what you just learned',
      instructions: `Complete these ${tasks.length} quick practice tasks. Each task should take about 5-10 minutes.`,
      estimatedDuration: `${tasks.length * 10} minutes`,
      tasks,
      skills,
      resources: [
        ...resources,
        // Include video description links if available
        ...(content.match(/https?:\/\/[^\s]+/g) || [])
          .map(url => ({
            title: 'Referenced Link',
            type: 'link' as const,
            url,
            description: 'Link from video description'
          }))
      ]
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Assignment generation failed');
    logger.error('api', err.message, { error: err });
    throw err;
  }
}