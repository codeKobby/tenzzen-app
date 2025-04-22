// Google AI Course Schema for use with Google Generative AI and ADK

import { z } from "zod";

// Define the course schema using zod (adjust fields as needed for your use case)
export const courseSchema = z.object({
  title: z.string(),
  description: z.string(),
  videoId: z.string().optional(),
  image: z.string().optional(),
  metadata: z.object({
    difficulty: z.string().optional(),
    duration: z.string().optional(),
    prerequisites: z.array(z.string()).optional(),
    objectives: z.array(z.string()).optional(),
    category: z.string().optional(),
    sources: z.array(z.any()).optional()
  }).optional(),
  sections: z.array(
    z.object({
      title: z.string(),
      description: z.string().optional(),
      lessons: z.array(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          content: z.string().optional()
        })
      ).optional()
    })
  ).optional(),
  assessments: z.array(z.any()).optional(),
  resources: z.array(z.any()).optional()
});

export type GoogleAICourse = z.infer<typeof courseSchema>;
