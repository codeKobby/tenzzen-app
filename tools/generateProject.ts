import { logger } from '@/lib/ai/debug-logger';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod';
import { fetchResources } from './fetchResources';

// Schema for comprehensive project requirements
const requirementSchema = z.object({
  section: z.string(), // Course section this requirement tests
  feature: z.string(), // What to implement
  conceptsCovered: z.array(z.string()), // Concepts being tested
  specs: z.array(z.string()), // Technical specifications
  validationPoints: z.array(z.string()), // How to verify understanding
  referenceMaterial: z.object({
    timestamp: z.string(), // Timestamp in course where concept was covered
    description: z.string() // Brief reminder of the concept
  })
});

export type Requirement = z.infer<typeof requirementSchema>;

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

export interface ProjectParams {
  courseContent: string;
  requiredSkills: string[];
  temperature?: number;
}

export async function generateProject({
  courseContent,
  requiredSkills,
  temperature = 0.7
}: ProjectParams) {
  try {
    const result = await generateText({
      model: googleModel,
      maxTokens: 2048,
      temperature,
      messages: [{
        role: 'user',
        content: `
Design a comprehensive project that tests understanding of all major course concepts:

Course Content:
${courseContent}

Core Skills Required:
${requiredSkills.join('\n')}

Project Development Guidelines:
1. For each major section:
   - Create tasks that directly test concepts covered
   - Reference specific parts of the course (timestamps)
   - Include validation points to verify understanding
2. Requirements should:
   - Progress from basic to complex concepts
   - Demonstrate practical application
   - Show understanding of theory
3. Each feature must:
   - Use multiple concepts together
   - Challenge the learner appropriately
   - Have clear success criteria
4. Include review points to ensure:
   - Core concepts are well understood
   - Skills can be practically applied
   - Knowledge is integrated properly
5. Verification should test:
   - Technical implementation
   - Conceptual understanding
   - Problem-solving ability
`
      }],
      tools: {
        defineProject: {
          description: "Define capstone project requirements",
          parameters: z.object({
            title: z.string(),
            description: z.string(),
            overview: z.string(),
            requirements: z.array(requirementSchema),
            timeline: z.string(),
            submissionGuidelines: z.array(z.string()),
            evaluationCriteria: z.array(z.string())
          })
        }
      },
      toolChoice: {
        type: 'tool',
        toolName: 'defineProject'
      }
    });

    if (!result.toolCalls?.[0]?.args) {
      throw new Error('No project definition generated');
    }

    const projectDef = result.toolCalls[0].args;

    // Get helpful resources
    const resources = await fetchResources({
      content: courseContent,
      description: `Resources for capstone project: ${projectDef.title}`,
      maxResults: 5
    });

    logger.info('state', 'Capstone project generated', {
      title: projectDef.title,
      requirementCount: projectDef.requirements.length,
      resourceCount: resources.length
    });

    // Extract course links
    const courseLinks = (courseContent.match(/https?:\/\/[^\s]+/g) || [])
      .map(url => ({
        title: 'Course Reference',
        type: 'link' as const,
        url,
        description: 'Link from course content'
      }));

    // Group requirements by section for better organization
    const sections = projectDef.requirements.map(req => ({
      title: req.section,
      concepts: req.conceptsCovered,
      implementation: {
        feature: req.feature,
        specs: req.specs,
        reference: req.referenceMaterial
      },
      validation: {
        checkpoints: req.validationPoints,
        reviewPoints: projectDef.evaluationCriteria.filter(ec =>
          ec.toLowerCase().includes(req.section.toLowerCase())
        )
      }
    }));

    return {
      title: projectDef.title,
      description: projectDef.description,
      overview: {
        objective: projectDef.overview,
        timeEstimate: projectDef.timeline,
        prerequisites: requiredSkills
      },
      sections,
      submission: {
        formats: ['file upload', 'git repo link'],
        requirements: projectDef.submissionGuidelines,
        deadline: projectDef.timeline,
        evaluation: projectDef.evaluationCriteria
      },
      resources: [...resources, ...courseLinks]
    };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Project generation failed');
    logger.error('api', err.message, { error: err });
    throw err;
  }
}