import { z } from "zod";
import type { CourseGeneratorResult } from "@/tools/courseGenerator";

// Validation schema
const resourceSchema = z.object({
  title: z.string(),
  type: z.enum(["article", "video", "code", "document", "link"]),
  url: z.string().url(),
  description: z.string()
});

const lessonSchema = z.object({
  title: z.string(),
  description: z.string(),
  content: z.string(),
  duration: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  resources: z.array(resourceSchema)
});

const assessmentSchema = z.object({
  id: z.string(),
  type: z.enum(["test", "assignment", "project"]),
  title: z.string(),
  description: z.string(),
  position: z.number(),
  isLocked: z.boolean(),
  requiredSkills: z.array(z.string()),
  estimatedDuration: z.string(),
  contentGenerated: z.boolean()
});

const sectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  duration: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  lessons: z.array(lessonSchema),
  assessments: z.array(assessmentSchema)
});

const prerequisiteSchema = z.object({
  title: z.string(),
  description: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"])
});

const learningOutcomeSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(["skill", "knowledge", "tool"])
});

const overviewSchema = z.object({
  description: z.string(),
  prerequisites: z.array(prerequisiteSchema),
  learningOutcomes: z.array(learningOutcomeSchema),
  totalDuration: z.string(),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]),
  skills: z.array(z.string()),
  tools: z.array(z.string())
});

const courseSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  overview: overviewSchema,
  sections: z.array(sectionSchema)
});

export function validateCourseData(data: unknown): CourseGeneratorResult | null {
  try {
    const result = courseSchema.parse(data);
    console.log('Course data validation successful');
    return result;
  } catch (error) {
    console.error('Course data validation failed:', error);
    return null;
  }
}

export function getSummary(course: CourseGeneratorResult) {
  const sections = course.sections.length;
  const lessons = course.sections.reduce(
    (acc, section) => acc + section.lessons.length, 
    0
  );
  const resources = course.sections.reduce(
    (acc, section) => acc + section.lessons.reduce(
      (lessonAcc, lesson) => lessonAcc + lesson.resources.length,
      0
    ),
    0
  );
  const assessments = course.sections.reduce(
    (acc, section) => acc + section.assessments.length,
    0
  );

  return {
    sections,
    lessons,
    resources,
    assessments,
    prerequisites: course.overview.prerequisites.length,
    outcomes: course.overview.learningOutcomes.length,
    skills: course.overview.skills.length,
    tools: course.overview.tools.length,
    totalDuration: course.overview.totalDuration,
    difficulty: course.overview.difficultyLevel
  };
}