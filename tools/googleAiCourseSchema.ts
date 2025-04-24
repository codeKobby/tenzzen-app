// Google AI Course Schema for use with Google Generative AI and ADK

import { z } from 'zod';

// --- Individual Item Schemas ---

const lessonSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  content: z.string().optional(), // Keep content if needed for direct generation
  duration: z.string().optional(), // Added duration from panel
  keyPoints: z.array(z.string()).optional(), // Added keyPoints from panel
});

const sectionSchema = z.object({
  type: z.literal('section'), // Discriminating type
  title: z.string(),
  description: z.string().optional(),
  lessons: z.array(lessonSchema).optional(),
  objective: z.string().optional(), // Added objective from panel
});

const assessmentPlaceholderSchema = z.object({
  type: z.literal('assessment_placeholder'), // Discriminating type
  assessmentType: z.enum(['quiz', 'assignment', 'test', 'project']), // Define possible types
  // Optional: Add a suggested title or brief description if desired
  // title: z.string().optional(),
});

// --- Main Course Schema ---

export const courseSchema = z.object({
  title: z.string().describe('The main title of the generated course.'),
  description: z.string().describe('A brief overview description of the course content.'),
  videoId: z.string().optional().describe('The YouTube video ID the course is based on.'),
  image: z.string().optional().describe('URL for the course thumbnail image.'),
  metadata: z
    .object({
      difficulty: z.string().optional().describe('Estimated difficulty level (e.g., Beginner, Intermediate, Advanced).'),
      duration: z.string().optional().describe('Estimated total course duration (e.g., "2 hours", "30 minutes").'),
      prerequisites: z.array(z.string()).optional().describe('List of prerequisites for taking the course.'),
      objectives: z.array(z.string()).optional().describe('List of learning objectives for the course.'),
      category: z.string().optional().describe('Suggested category for the course (e.g., Programming, Design).'),
      tags: z.array(z.string()).optional().describe('Relevant tags or keywords for the course.'), // Added tags from panel
      sources: z.array(z.object({ // Define source structure more clearly
        name: z.string(),
        avatar: z.string().url().optional(),
        type: z.string().optional(), // e.g., 'youtube_channel', 'website'
      })).optional().describe('List of content sources used or referenced.')
      // overviewText removed - will use top-level description
    })
    .optional(),

  // Use a discriminated union for the main course content flow
  courseItems: z.array(z.discriminatedUnion('type', [
      sectionSchema,
      assessmentPlaceholderSchema,
    ]))
    .describe('An ordered array representing the course structure, containing sections and assessment placeholders interspersed logically.'),

  // Keep resources separate as they are metadata/supplementary
  resources: z.array(z.object({ // Define resource structure more clearly
      title: z.string(),
      url: z.string().url().optional(),
      description: z.string().optional(),
      type: z.string().optional(), // e.g., 'book', 'article', 'tool'
      category: z.string().optional(), // e.g., 'Mentioned in Video', 'Supplementary Reading'
    })).optional().describe('List of general supplementary resources (articles, tools, websites).'),
  creatorResources: z.array(z.object({
    title: z.string().describe('Title of the creator-provided resource (e.g., "Patreon", "Source Code").'),
    url: z.string().url().describe('Direct URL to the creator resource.'),
  })).optional().describe('List of specific resources provided by the content creator (affiliate links, Patreon, etc.).'),
  creatorSocials: z.array(z.object({
    platform: z.string().describe('Name of the social media platform (e.g., Twitter, GitHub).'),
    url: z.string().url().describe('Direct URL to the creator\'s profile.'),
  })).optional().describe('List of the content creator\'s social media profiles.'),

  // Define project separately if it's always the final element, or integrate as an assessment type
  // Option 1: Separate final project (if always last)
  project: assessmentPlaceholderSchema.refine(data => data.assessmentType === 'project', {
    message: "Final assessment must be of type 'project'"
  }).optional().describe('Optional final project details, placed after all sections and other assessments.'),

  // Option 2: Integrate project into courseItems (if it can appear anywhere)
  // If using Option 2, remove the separate 'project' field above.
  // The assessmentPlaceholderSchema already includes 'project'.
});

export type GoogleAICourse = z.infer<typeof courseSchema>;
export type CourseItem = z.infer<typeof courseSchema.shape.courseItems>[number]; // Export CourseItem type
export type SectionItem = z.infer<typeof sectionSchema>;
export type AssessmentPlaceholderItem = z.infer<typeof assessmentPlaceholderSchema>;
