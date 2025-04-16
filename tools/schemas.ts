import { z } from 'zod';

// Base schema for course content
export const courseSchema = z.object({
  title: z.string().describe('The title of the course'),
  description: z.string().describe('A comprehensive description of the course'),
  learningObjectives: z.array(z.string()).describe('List of learning objectives for the course'),
  prerequisites: z.array(z.string()).describe('List of prerequisites for the course'),
  sections: z.array(z.object({
    title: z.string().describe('The title of this section'),
    description: z.string().describe('A brief description of this section'),
    lessons: z.array(z.object({
      title: z.string().describe('The title of this lesson'),
      content: z.string().describe('The detailed content of the lesson'),
      summary: z.string().describe('A brief summary of the key points'),
      questions: z.array(z.object({
        question: z.string().describe('A practice question related to the lesson'),
        options: z.array(z.string()).optional().describe('Possible answer options for multiple choice questions'),
        answer: z.string().describe('The correct answer to the question'),
        explanation: z.string().describe('Explanation of why this answer is correct')
      })).min(1).describe('Practice questions for the lesson')
    })).min(1).describe('Lessons in this section')
  })).min(1).describe('Course sections'),
  assessments: z.array(z.object({
    title: z.string().describe('Title of the assessment'),
    description: z.string().describe('Description of what the assessment covers'),
    questions: z.array(z.object({
      question: z.string().describe('The assessment question'),
      options: z.array(z.string()).optional().describe('Possible answer options for multiple choice questions'),
      answer: z.string().describe('The correct answer'),
      explanation: z.string().describe('Explanation of the correct answer')
    })).min(3).describe('Assessment questions')
  })).describe('Course assessments'),
  resources: z.array(z.object({
    title: z.string().describe('Title of the resource'),
    description: z.string().describe('Description of the resource'),
    url: z.string().url().optional().describe('URL to the resource if available')
  })).describe('Additional resources for the course')
});

export type Course = z.infer<typeof courseSchema>;

// Product schema for e-commerce applications
export const productSchema = z.object({
  name: z.string().describe('Product name'),
  description: z.string().describe('Detailed product description'),
  shortDescription: z.string().describe('Short product description for listings'),
  price: z.number().positive().describe('Product price'),
  images: z.array(z.string().url()).describe('URLs to product images'),
  category: z.string().describe('Product category'),
  subcategory: z.string().optional().describe('Product subcategory'),
  features: z.array(z.string()).describe('Key product features'),
  specifications: z.record(z.string()).describe('Technical specifications as key-value pairs'),
  variants: z.array(z.object({
    name: z.string().describe('Variant name'),
    attributes: z.record(z.string()).describe('Variant attributes (color, size, etc.)'),
    price: z.number().positive().optional().describe('Variant-specific price if different from base')
  })).optional().describe('Product variants if applicable')
});

export type Product = z.infer<typeof productSchema>;

// Blog post schema
export const blogPostSchema = z.object({
  title: z.string().describe('Blog post title'),
  subtitle: z.string().optional().describe('Optional subtitle'),
  content: z.string().describe('Full blog post content in markdown format'),
  summary: z.string().describe('Brief summary of the blog post'),
  tags: z.array(z.string()).describe('Related tags for the blog post'),
  seoTitle: z.string().optional().describe('SEO-optimized title if different from main title'),
  seoDescription: z.string().describe('SEO meta description'),
  relatedTopics: z.array(z.string()).describe('Related topics to this blog post')
});

export type BlogPost = z.infer<typeof blogPostSchema>;

// FAQ schema
export const faqSchema = z.object({
  items: z.array(z.object({
    question: z.string().describe('The frequently asked question'),
    answer: z.string().describe('The comprehensive answer to the question'),
    category: z.string().optional().describe('Optional category for grouping related FAQs')
  })).min(1).describe('List of FAQ items')
});

export type FAQ = z.infer<typeof faqSchema>;

// User profile schema
export const userProfileSchema = z.object({
  name: z.string().describe('User\'s full name'),
  bio: z.string().describe('User\'s biography or about information'),
  skills: z.array(z.string()).describe('User\'s skills'),
  experience: z.array(z.object({
    title: z.string().describe('Job title'),
    company: z.string().describe('Company name'),
    description: z.string().describe('Description of responsibilities and achievements'),
    startDate: z.string().describe('Start date of employment'),
    endDate: z.string().optional().describe('End date of employment, omit for current positions')
  })).describe('User\'s professional experience'),
  education: z.array(z.object({
    institution: z.string().describe('Educational institution name'),
    degree: z.string().describe('Degree earned'),
    fieldOfStudy: z.string().describe('Field of study'),
    startYear: z.number().describe('Start year'),
    endYear: z.number().optional().describe('End year, omit for ongoing education')
  })).describe('User\'s educational background')
});

export type UserProfile = z.infer<typeof userProfileSchema>;

// Recipe schema
export const recipeSchema = z.object({
  title: z.string().describe('Recipe title'),
  description: z.string().describe('Brief description of the recipe'),
  prepTime: z.number().describe('Preparation time in minutes'),
  cookTime: z.number().describe('Cooking time in minutes'),
  servings: z.number().describe('Number of servings'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('Recipe difficulty level'),
  ingredients: z.array(z.object({
    name: z.string().describe('Ingredient name'),
    amount: z.string().describe('Amount needed'),
    notes: z.string().optional().describe('Optional notes about the ingredient')
  })).describe('List of ingredients needed'),
  instructions: z.array(z.string()).describe('Step-by-step cooking instructions'),
  tips: z.array(z.string()).optional().describe('Optional cooking tips'),
  nutritionalInfo: z.object({
    calories: z.number().optional(),
    protein: z.string().optional(),
    carbs: z.string().optional(),
    fat: z.string().optional()
  }).optional().describe('Nutritional information if available')
});

export type Recipe = z.infer<typeof recipeSchema>;

// Create your own custom schema by following this pattern
export const customSchema = <T extends z.ZodType>(schema: T) => schema;