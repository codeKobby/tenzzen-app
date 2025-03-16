import { tool } from 'ai';
import { z } from 'zod';

// Input schema
const videoDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.string()
});

// Course structure schema with references
const learningOutcomeSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(['skill', 'knowledge', 'tool'])
});

const prerequisiteSchema = z.object({
  title: z.string(),
  description: z.string(),
  level: z.enum(['beginner', 'intermediate', 'advanced'])
});

const resourceSchema = z.object({
  title: z.string(),
  type: z.enum(['article', 'video', 'code', 'document']),
  url: z.string(),
  description: z.string()
});

const testQuestionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.number(),
  explanation: z.string()
});

const testSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  timeLimit: z.number(),
  passingScore: z.number(),
  questions: z.array(testQuestionSchema),
  isLocked: z.boolean()
});

const lessonSchema: z.ZodSchema = z.lazy(() => z.object({
  id: z.string(),
  title: z.string(),
  duration: z.string(),
  description: z.string(),
  content: z.string(),
  isLocked: z.boolean(),
  resources: z.array(resourceSchema),
  test: testSchema
}));

const sectionSchema: z.ZodSchema = z.lazy(() => z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.string(),
  lessons: z.array(lessonSchema),
  isLocked: z.boolean()
}));

const courseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  overview: z.object({
    description: z.string(),
    prerequisites: z.array(prerequisiteSchema),
    learningOutcomes: z.array(learningOutcomeSchema),
    totalDuration: z.string(),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    skills: z.array(z.string()),
    tools: z.array(z.string())
  }),
  sections: z.array(sectionSchema)
});

export type VideoData = z.infer<typeof videoDataSchema>;
export type CourseStructure = z.infer<typeof courseSchema>;

// Create course generator tool
export const generateCourseFromVideo = tool({
  description: "Generate a structured course from video content",
  parameters: videoDataSchema,
  execute: async ({ title, description, duration }) => {
    // Generate initial course structure
    const course: CourseStructure = {
      title: `Course: ${title}`,
      subtitle: `Learn from ${title}`,
      overview: {
        description,
        prerequisites: [
          {
            title: 'Basic Understanding',
            description: 'Familiarity with the subject matter',
            level: 'beginner'
          }
        ],
        learningOutcomes: [
          {
            title: 'Core Concepts',
            description: 'Understand the main concepts presented in the video',
            category: 'knowledge'
          }
        ],
        totalDuration: duration,
        difficultyLevel: 'intermediate',
        skills: ['subject knowledge'],
        tools: ['video learning']
      },
      sections: [
        {
          id: 's1',
          title: 'Introduction',
          description: 'Getting started with the course',
          duration: '10m',
          lessons: [
            {
              id: 'l1.1',
              title: 'Course Overview',
              duration: '5m',
              description: 'Course overview and objectives',
              content: 'Welcome to the course...',
              isLocked: false,
              resources: [
                {
                  title: 'Video Resource',
                  type: 'video',
                  url: `https://example.com/resources/${encodeURIComponent(title)}`,
                  description: 'Original video content'
                }
              ],
              test: {
                id: 't1.1',
                title: 'Quick Check',
                description: 'Verify your understanding',
                timeLimit: 5,
                passingScore: 80,
                questions: [
                  {
                    question: 'What is the main topic of this course?',
                    options: [
                      title,
                      'Other Topic',
                      'Unrelated Subject',
                      'None of the above'
                    ],
                    correctAnswer: 0,
                    explanation: 'This course is based on the video content about ' + title
                  }
                ],
                isLocked: false
              }
            }
          ],
          isLocked: false
        }
      ]
    };

    return course;
  }
});

export type CourseGeneratorResult = CourseStructure;