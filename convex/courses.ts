import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";

import { CourseContent, generateCourseStructure } from "@/lib/ai/tools/course-generator";

// Generate a new course from video content
export const generateCourse = mutation({
  args: {
    videoId: v.string(),
    options: v.optional(v.object({
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number())
    }))
  },
  async handler({ db }, { videoId, options }) {
    console.log("Starting course generation for video:", videoId);

    try {
      // First, store a placeholder course
      const now = Date.now();
      const courseId = await db.insert("courses", {
        title: "Generating Course...",
        subtitle: "Please wait while we analyze the content",
        overview: {
          description: "Generating course content...",
          prerequisites: [],
          learningOutcomes: [],
          totalDuration: "TBD",
          difficultyLevel: "intermediate",
          skills: [],
          tools: []
        },
        sections: [],
        createdAt: now,
        updatedAt: now,
        status: "generating"
      });

      // Generate course content
      const courseContent = await generateCourseStructure({
        videoId,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2048
      });

      // Update the course with generated content
      await db.patch(courseId, {
        title: courseContent.title,
        subtitle: courseContent.subtitle,
        overview: {
          description: courseContent.overview.description,
          prerequisites: courseContent.overview.prerequisites,
          learningOutcomes: courseContent.overview.learningOutcomes,
          totalDuration: courseContent.overview.totalDuration,
          difficultyLevel: courseContent.overview.difficultyLevel,
          skills: courseContent.overview.skills,
          tools: courseContent.overview.tools
        },
        sections: courseContent.sections.map((section, index) => ({
          id: `section-${index + 1}`,
          ...section,
          lessons: section.lessons.map((lesson, lessonIndex) => ({
            id: `lesson-${index + 1}-${lessonIndex + 1}`,
            ...lesson
          })),
          assessments: section.assessments.map((assessment, assessmentIndex) => ({
            id: `assessment-${index + 1}-${assessmentIndex + 1}`,
            ...assessment,
            contentGenerated: false,
            isLocked: true
          }))
        })),
        status: "ready",
        updatedAt: Date.now()
      });

      // Return the generated course
      const course = await db.get(courseId);
      return course;
      
    } catch (err) {
      console.error("Course generation failed:", err);
      throw new Error("Failed to generate course");
    }
  }
});

// Get a course by ID
export const getCourse = query({
  args: { courseId: v.id("courses") },
  async handler({ db }, { courseId }) {
    const course = await db.get(courseId);
    return course;
  }
});

// List all courses
export const listCourses = query({
  args: {},
  async handler({ db }) {
    return await db.query("courses")
      .filter(q => q.eq(q.field("status"), "ready"))
      .collect();
  }
});