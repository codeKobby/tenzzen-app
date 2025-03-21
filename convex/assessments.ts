import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import type { AssessmentBase } from "@/types/course";
import type { AssessmentContent, DbAssessment } from "./types";

// Generate content using AI
export const generateContent = action({
  args: { 
    type: v.union(
      v.literal("test"),
      v.literal("assignment"),
      v.literal("project")
    ),
    content: v.string(),
    options: v.optional(v.object({
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number())
    }))
  },
  handler: async (ctx, args) => {
    if (process.env.NODE_ENV === "development") {
      return getMockContent(args.type);
    }

    const response = await fetch(process.env.AI_ENDPOINT!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        type: args.type,
        content: args.content,
        ...args.options
      })
    });

    return response.json();
  }
});

// Helper function to create empty assessment content
function getEmptyContent(type: "test" | "assignment" | "project"): AssessmentContent {
  const base = {
    title: "Pending Generation",
    description: "Content will be generated when needed"
  };

  switch (type) {
    case "test":
      return {
        ...base,
        type: "test",
        questions: []
      };
    case "assignment":
      return {
        ...base,
        type: "assignment",
        tasks: []
      };
    case "project":
      return {
        ...base,
        type: "project",
        guidelines: "Pending generation",
        submissionFormats: ["file upload"],
        deadline: "TBD"
      };
  }
}

// Get assessment content
export const getAssessmentContent = query({
  args: { 
    courseId: v.id("courses"),
    assessmentId: v.string()
  },
  async handler({ db }, { courseId, assessmentId }) {
    const content = await db
      .query("assessments")
      .withIndex("by_assessment", (q) => 
        q
          .eq("courseId", courseId)
          .eq("assessmentId", assessmentId)
      )
      .first();

    return content?.content ?? null;
  }
});

// Generate and store assessment
export const generateAssessment = mutation({
  args: { 
    courseId: v.id("courses"),
    sectionId: v.string(),
    assessmentId: v.string(),
    type: v.union(
      v.literal("test"),
      v.literal("assignment"),
      v.literal("project")
    ),
    context: v.string()
  },
  async handler({ db }, args) {
    // Check if already generated
    const existing = await db
      .query("assessments")
      .withIndex("by_assessment", (q) => 
        q
          .eq("courseId", args.courseId)
          .eq("assessmentId", args.assessmentId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    // Get course for context
    const course = await db.get(args.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // Create initial assessment with empty content
    const now = Date.now();
    const initialAssessment: Omit<DbAssessment, "_id" | "_creationTime"> = {
      courseId: args.courseId,
      sectionId: args.sectionId,
      assessmentId: args.assessmentId,
      type: args.type,
      content: getEmptyContent(args.type),
      isLocked: true,
      contentGenerated: false,
      createdAt: now,
      updatedAt: now
    };

    return await db.insert("assessments", initialAssessment);
  }
});

// Get section assessments
export const getSectionAssessments = query({
  args: { 
    courseId: v.id("courses"),
    sectionId: v.string()
  },
  async handler({ db }, { courseId, sectionId }) {
    const course = await db.get(courseId);
    if (!course) {
      return [];
    }

    const section = course.sections.find(s => s.id === sectionId);
    if (!section) {
      return [];
    }

    // Get assessments with content
    const assessments = await Promise.all(
      section.assessments.map(async (assessment: AssessmentBase) => {
        const content = await db
          .query("assessments")
          .withIndex("by_assessment", (q) => 
            q
              .eq("courseId", courseId)
              .eq("assessmentId", assessment.id)
          )
          .first();

        return {
          ...assessment,
          content: content?.content ?? getEmptyContent(assessment.type)
        };
      })
    );

    return assessments;
  }
});

// Update assessment status
export const updateAssessmentStatus = mutation({
  args: { 
    courseId: v.id("courses"),
    sectionId: v.string(),
    assessmentId: v.string(),
    isLocked: v.boolean()
  },
  async handler({ db }, args) {
    const assessment = await db
      .query("assessments")
      .withIndex("by_assessment", (q) => 
        q
          .eq("courseId", args.courseId)
          .eq("assessmentId", args.assessmentId)
      )
      .first();

    if (!assessment) {
      throw new Error("Assessment not found");
    }

    await db.patch(assessment._id, {
      isLocked: args.isLocked,
      updatedAt: Date.now()
    });

    return assessment;
  }
});

// Helper function for development mode
function getMockContent(type: "test" | "assignment" | "project"): AssessmentContent {
  switch (type) {
    case "test":
      return {
        type: "test",
        title: "Mock Test",
        description: "A test of your knowledge",
        questions: [{
          question: "What is your understanding?",
          type: "written",
          correctAnswer: "Any reasonable explanation",
          explanation: "This is a practice question"
        }]
      };

    case "assignment":
      return {
        type: "assignment",
        title: "Mock Assignment",
        description: "Practice what you learned",
        tasks: [{
          title: "Task 1",
          description: "Complete this task",
          acceptance: ["Criterion 1", "Criterion 2"],
          hint: "Here's a hint"
        }]
      };

    case "project":
      return {
        type: "project",
        title: "Mock Project",
        description: "Apply your knowledge",
        guidelines: "Follow these steps...",
        submissionFormats: ["git repo link"],
        deadline: "2 weeks"
      };
  }
}