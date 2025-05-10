import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel"; // Added Doc
import { AssessmentType, SubmissionStatus, DifficultyLevel, ProgressStatus, SubmissionType } from "./schema";

// Get assessments for a course
export const getCourseAssessments = query({
  args: {
    courseId: v.id("courses"),
    type: v.optional(v.string()),
    userId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Start with a base query for the course's assessments
    let assessmentsQuery = ctx.db
      .query("assessments")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId)); // Use index

    // Filter by type if provided
    if (args.type) {
      // Further filter the indexed query
      assessmentsQuery = assessmentsQuery.filter(q => q.eq(q.field("type"), args.type));
    }

    // Execute query
    const assessments = await assessmentsQuery.collect();

    // If userId is provided, include user's progress for each assessment
    if (args.userId) {
      const assessmentsWithProgress = await Promise.all(
        assessments.map(async (assessment) => {
          const progress = await ctx.db
            .query("progress")
            .withIndex("by_user_assessment", (q) => // Use index
              q.eq("userId", args.userId!)
               .eq("assessmentId", assessment._id)
            )
            .first();

          // For project assessments, also get submissions
          let submissions: Doc<"project_submissions">[] = []; // Type submissions
          if (assessment.type === "project") {
            submissions = await ctx.db
              .query("project_submissions")
              .withIndex("by_user_assessment", (q) => // Use index
                q.eq("userId", args.userId!)
                 .eq("assessmentId", assessment._id)
              )
              .collect();
          }

          return {
            ...assessment,
            progress,
            submissions
          };
        })
      );

      return assessmentsWithProgress;
    }

    return assessments;
  }
});

// Create or update an assessment
export const createOrUpdateAssessment = mutation({
  args: {
    assessmentId: v.optional(v.id("assessments")),
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    type: v.string(), // "quiz", "project", etc.
    questions: v.optional(v.array(v.any())),
    instructions: v.optional(v.string()),
    projectRequirements: v.optional(v.array(v.string())),
    submissionType: v.optional(v.string()),
    resources: v.optional(v.array(v.object({
      title: v.string(),
      url: v.string(),
      type: v.string()
    }))),
    deadline: v.optional(v.number()),
    // Added fields from schema
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert")
    )),
    estimatedTime: v.optional(v.number()),
    passingScore: v.optional(v.number()),
    allowRetries: v.optional(v.boolean()),
    maxRetries: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate assessment data based on type
    if (args.type === "quiz" && (!args.questions || args.questions.length === 0)) {
      throw new Error("Questions are required for quiz assessments");
    }

    if (args.type === "project" && !args.instructions) {
      throw new Error("Instructions are required for project assessments");
    }

    // Check if course exists
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error(`Course with ID ${args.courseId} not found`);
    }

    const assessmentData = {
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      type: args.type as AssessmentType,
      questions: args.questions,
      instructions: args.instructions,
      projectRequirements: args.projectRequirements,
      submissionType: args.submissionType as SubmissionType,
      resources: args.resources,
      deadline: args.deadline,
      difficulty: args.difficulty as DifficultyLevel,
      estimatedTime: args.estimatedTime,
      passingScore: args.passingScore,
      allowRetries: args.allowRetries,
      maxRetries: args.maxRetries,
    };

    // Update existing assessment
    if (args.assessmentId) {
      const existingAssessment = await ctx.db.get(args.assessmentId);
      if (!existingAssessment) {
        throw new Error(`Assessment with ID ${args.assessmentId} not found`);
      }

      // Update assessment
      await ctx.db.patch(args.assessmentId, assessmentData);

      return { assessmentId: args.assessmentId, isNew: false };
    }

    // Create new assessment
    const assessmentId = await ctx.db.insert("assessments", {
      ...assessmentData,
      createdAt: now
    });

    return { assessmentId, isNew: true };
  }
});

// Start or continue an assessment
export const startAssessment = mutation({
  args: {
    assessmentId: v.id("assessments"),
    userId: v.string()
  },
  handler: async (ctx, args) => {
    // Check if assessment exists
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) {
      throw new Error(`Assessment with ID ${args.assessmentId} not found`);
    }

    // Check if user already has progress for this assessment
    const existingProgress = await ctx.db
      .query("progress")
      .withIndex("by_user_assessment", (q) => // Use index
        q.eq("userId", args.userId)
         .eq("assessmentId", args.assessmentId)
      )
      .first();

    const now = Date.now();

    if (existingProgress) {
      // Update existing progress
      await ctx.db.patch(existingProgress._id, {
        status: existingProgress.status === "not_started" ? "in_progress" : existingProgress.status,
        // Optionally update startedAt if restarting?
        // startedAt: existingProgress.status === "not_started" ? now : existingProgress.startedAt
      });

      return { progressId: existingProgress._id, status: existingProgress.status, isNew: false };
    }

    // Create new progress record
    const progressId = await ctx.db.insert("progress", {
      userId: args.userId,
      assessmentId: args.assessmentId,
      status: "in_progress",
      startedAt: now,
      attemptNumber: 1 // Start with attempt 1
    });

    // Record learning activity
    await ctx.db.insert("learning_activities", {
      userId: args.userId,
      type: "started_assessment",
      assessmentId: args.assessmentId,
      courseId: assessment.courseId,
      timestamp: now,
      metadata: { assessmentTitle: assessment.title }
    });

    return { progressId, status: "in_progress", isNew: true };
  }
});

// Submit a quiz assessment
export const submitQuizAssessment = mutation({
  args: {
    progressId: v.id("progress"),
    userId: v.string(),
    answers: v.array(v.object({
      questionId: v.string(),
      selectedAnswer: v.any()
    }))
  },
  handler: async (ctx, args) => {
    // Get progress record
    const progress = await ctx.db.get(args.progressId);
    if (!progress) {
      throw new Error(`Progress with ID ${args.progressId} not found`);
    }

    // Verify user owns this progress record
    if (progress.userId !== args.userId) {
      throw new Error("You don't have permission to submit this assessment");
    }

    // Prevent re-submission if already completed/graded
    if (progress.status === "completed" || progress.status === "graded") {
      // Allow retry logic could be added here based on assessment.allowRetries
      throw new Error("Assessment already submitted");
    }

    // Get assessment
    const assessment = await ctx.db.get(progress.assessmentId);
    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Verify this is a quiz assessment
    if (assessment.type !== "quiz") {
      throw new Error("This is not a quiz assessment");
    }

    // Calculate score
    let score = 0;
    const questions = assessment.questions || [];
    const feedback: { questionId: string; correct: boolean; explanation: string }[] = []; // Type feedback

    for (const answer of args.answers) {
      const question = questions.find((q: any) => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      if (isCorrect) {
        score += 1;
      }

      feedback.push({
        questionId: answer.questionId,
        correct: isCorrect,
        explanation: question.explanation || ""
      });
    }

    const totalScore = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    const now = Date.now();
    const timeSpent = now - (progress.startedAt || now); // Calculate time spent

    // Update progress record
    await ctx.db.patch(args.progressId, {
      status: "completed",
      score: totalScore,
      submission: args.answers,
      feedback: feedback,
      completedAt: now,
      timeSpent: (progress.timeSpent || 0) + timeSpent // Accumulate time spent
    });

    // Record learning activity
    await ctx.db.insert("learning_activities", {
      userId: args.userId,
      type: "completed_assessment",
      assessmentId: assessment._id,
      courseId: assessment.courseId,
      timestamp: now,
      metadata: {
        assessmentTitle: assessment.title,
        score: totalScore,
        timeSpent: timeSpent
      }
    });

    // Update user stats
    const userStats = await ctx.db
      .query("user_stats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId)) // Use index
      .first();

    if (userStats) {
      // Get current values, handling both camelCase and snake_case
      const currentAssessments = userStats.assessmentsCompleted || userStats.assessments_completed || 0;
      const currentHours = userStats.totalLearningHours || userStats.total_learning_hours || 0;
      const hoursSpent = timeSpent / (1000 * 60 * 60);

      await ctx.db.patch(userStats._id, {
        // Update both camelCase and snake_case fields
        assessmentsCompleted: currentAssessments + 1,
        assessments_completed: currentAssessments + 1,
        lastActiveAt: now,
        last_active_at: now,
        totalLearningHours: currentHours + hoursSpent,
        total_learning_hours: currentHours + hoursSpent
      });
    }

    return {
      score: totalScore,
      feedback,
      status: "completed"
    };
  }
});

// Submit a project for assessment
export const submitProject = mutation({
  args: {
    assessmentId: v.id("assessments"),
    userId: v.string(),
    submissionUrl: v.optional(v.string()),
    fileIds: v.optional(v.array(v.string())),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check if assessment exists
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) {
      throw new Error(`Assessment with ID ${args.assessmentId} not found`);
    }

    // Verify this is a project assessment
    if (assessment.type !== "project") {
      throw new Error("This is not a project assessment");
    }

    // Check required fields based on submission type
    if (assessment.submissionType === "link" && !args.submissionUrl) {
      throw new Error("URL is required for this project submission");
    }

    if (assessment.submissionType === "file" && (!args.fileIds || args.fileIds.length === 0)) {
      throw new Error("Files are required for this project submission");
    }

    const now = Date.now();

    // Check if user already has a submission for this assessment
    const existingSubmission = await ctx.db
      .query("project_submissions")
      .withIndex("by_user_assessment", (q) => // Use index
        q.eq("userId", args.userId)
         .eq("assessmentId", args.assessmentId)
      )
      .first();

    let submissionId;
    let revisionCount = 0;

    if (existingSubmission) {
      // Check if revisions are allowed or if it's already approved
      if (existingSubmission.status === "approved") {
        throw new Error("Project already approved, cannot resubmit.");
      }
      // Increment revision count
      revisionCount = (existingSubmission.revisionCount || 0) + 1;

      // Update existing submission
      await ctx.db.patch(existingSubmission._id, {
        submissionUrl: args.submissionUrl,
        fileIds: args.fileIds,
        notes: args.notes,
        status: "submitted", // Reset status on resubmission
        submittedAt: now,
        reviewedAt: undefined, // Clear previous review timestamp
        feedback: undefined, // Clear previous feedback
        grade: undefined, // Clear previous grade
        revisionCount: revisionCount
      });

      submissionId = existingSubmission._id;
    } else {
      // Create new submission
      submissionId = await ctx.db.insert("project_submissions", {
        userId: args.userId,
        assessmentId: args.assessmentId,
        submissionUrl: args.submissionUrl,
        fileIds: args.fileIds,
        notes: args.notes,
        status: "submitted" as SubmissionStatus,
        submittedAt: now,
        revisionCount: 0
      });
    }

    // Update progress record
    const progress = await ctx.db
      .query("progress")
      .withIndex("by_user_assessment", (q) => // Use index
        q.eq("userId", args.userId)
         .eq("assessmentId", args.assessmentId)
      )
      .first();

    const timeSpent = now - (progress?.startedAt || now);

    if (progress) {
      await ctx.db.patch(progress._id, {
        status: "in_progress" as ProgressStatus,
        submission: {
          submissionId,
          submissionUrl: args.submissionUrl,
          fileIds: args.fileIds
        },
        // completedAt: now, // Don't mark as completed until reviewed/approved
        timeSpent: (progress.timeSpent || 0) + timeSpent // Accumulate time spent
      });
    } else {
      // Create progress record if it doesn't exist (should ideally exist from startAssessment)
      await ctx.db.insert("progress", {
        userId: args.userId,
        assessmentId: args.assessmentId,
        status: "in_progress" as ProgressStatus,
        submission: {
          submissionId,
          submissionUrl: args.submissionUrl,
          fileIds: args.fileIds
        },
        startedAt: now, // Or fetch from submission?
        // completedAt: now,
        timeSpent: timeSpent,
        attemptNumber: 1
      });
    }

    // Record learning activity
    await ctx.db.insert("learning_activities", {
      userId: args.userId,
      type: "submitted_project",
      assessmentId: args.assessmentId,
      courseId: assessment.courseId,
      timestamp: now,
      metadata: {
        assessmentTitle: assessment.title,
        revisionCount: revisionCount,
        timeSpent: timeSpent
      }
    });

    // Update user stats
    const userStats = await ctx.db
      .query("user_stats")
      .withIndex("by_user", (q) => q.eq("userId", args.userId)) // Use index
      .first();

    if (userStats) {
      // Get current values, handling both camelCase and snake_case
      const currentProjects = userStats.projectsSubmitted || userStats.projects_submitted || 0;
      const currentHours = userStats.totalLearningHours || userStats.total_learning_hours || 0;
      const hoursSpent = timeSpent / (1000 * 60 * 60);
      const incrementProjects = revisionCount === 0 ? 1 : 0;

      await ctx.db.patch(userStats._id, {
        // Update both camelCase and snake_case fields
        projectsSubmitted: currentProjects + incrementProjects,
        projects_submitted: currentProjects + incrementProjects,
        lastActiveAt: now,
        last_active_at: now,
        totalLearningHours: currentHours + hoursSpent,
        total_learning_hours: currentHours + hoursSpent
      });
    }

    return {
      submissionId,
      status: "submitted"
    };
  }
});

// Review a project submission (for instructors/course creators)
export const reviewProjectSubmission = mutation({
  args: {
    submissionId: v.id("project_submissions"),
    reviewerId: v.string(), // Assuming reviewerId is the userId of the reviewer
    status: v.union(v.literal("approved"), v.literal("revisions_requested")), // Use union for specific statuses
    feedback: v.string(),
    grade: v.optional(v.number()),
    reviewerNotes: v.optional(v.string()) // Added from schema
  },
  handler: async (ctx, args) => {
    // Get submission
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error(`Submission with ID ${args.submissionId} not found`);
    }

    // Get assessment
    const assessment = await ctx.db.get(submission.assessmentId);
    if (!assessment) {
      throw new Error("Assessment not found");
    }

    // Get course
    const course = await ctx.db.get(assessment.courseId);
    if (!course) {
      throw new Error("Course not found");
    }

    // TODO: Implement proper permission check (e.g., check if reviewerId is course creator or admin)
    // if (course.creatorId !== args.reviewerId) {
    //   throw new Error("You don't have permission to review this submission");
    // }

    const now = Date.now();

    // Update submission
    await ctx.db.patch(args.submissionId, {
      status: args.status as SubmissionStatus, // Cast is okay here due to v.union validation
      feedback: args.feedback,
      grade: args.grade,
      reviewedAt: now,
      reviewerNotes: args.reviewerNotes
    });

    // Update progress record
    const progress = await ctx.db
      .query("progress")
      .withIndex("by_user_assessment", (q) => // Use index
        q.eq("userId", submission.userId)
         .eq("assessmentId", submission.assessmentId)
      )
      .first();

    if (progress) {
      // Create a properly typed progressUpdates object with correct typing
      const progressUpdates: Partial<Doc<"progress">> = {
        status: "graded",
        feedback: args.feedback
      };

      // Only add score if defined
      if (args.grade !== undefined) {
        progressUpdates.score = args.grade;
      }

      // Mark as completed only if approved
      if (args.status === "approved") {
        progressUpdates.completedAt = now;
        progressUpdates.status = "completed";
      }

      // Update the progress record
      await ctx.db.patch(progress._id, progressUpdates);
    }

    // Record learning activity for the student
    await ctx.db.insert("learning_activities", {
      userId: submission.userId,
      type: "received_feedback",
      assessmentId: submission.assessmentId,
      courseId: assessment.courseId,
      timestamp: now,
      metadata: {
        assessmentTitle: assessment.title,
        status: args.status,
        grade: args.grade
      }
    });

    // If approved, potentially update user stats for completed assessment/project
    if (args.status === "approved") {
      const userStats = await ctx.db
        .query("user_stats")
        .withIndex("by_user", (q) => q.eq("userId", submission.userId))
        .first();
      if (userStats) {
        // Get current values, handling both camelCase and snake_case
        const currentAssessments = userStats.assessmentsCompleted || userStats.assessments_completed || 0;

        await ctx.db.patch(userStats._id, {
          // Update both camelCase and snake_case fields
          assessmentsCompleted: currentAssessments + 1,
          assessments_completed: currentAssessments + 1,
          // projectsSubmitted was incremented on first submit
        });
      }
    }

    return {
      success: true,
      status: args.status
    };
  }
});

// Generate a new project for a student (Placeholder Implementation)
export const generateNewProject = mutation({
  args: {
    userId: v.string(),
    courseId: v.id("courses"),
    difficulty: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert")
    ),
    previousProjectIds: v.optional(v.array(v.id("assessments")))
  },
  handler: async (ctx, args) => {
    // Check if course exists
    const course = await ctx.db.get(args.courseId);
    if (!course) {
      throw new Error(`Course with ID ${args.courseId} not found`);
    }

    const now = Date.now();

    // This would typically call an AI model to generate a new project
    // For now, we'll create a placeholder project
    const projectTitle = `${course.title} - ${args.difficulty} Project (Generated)`;
    const projectDescription = `This is a dynamically generated ${args.difficulty} project based on your progress in ${course.title}.`;

    // Get course sections and relevant topics
    const sections = course.sections || [];
    const topics = sections.flatMap((section: any) => {
      return (section.lessons || []).map((lesson: any) => lesson.title);
    });

    // Generate requirements based on course topics
    const requirements = [
      "Implement core functionality covered in the course",
      "Create clear documentation for your implementation",
      "Follow best practices for code organization and style",
      ...topics.slice(0, 3).map((topic: string) => `Utilize concepts from: ${topic}`)
    ];

    // Create the new assessment
    const assessmentId = await ctx.db.insert("assessments", {
      courseId: args.courseId,
      title: projectTitle,
      description: projectDescription,
      type: "project" as AssessmentType,
      instructions: `Build a project that demonstrates your understanding of ${course.title}. This project was dynamically generated for you based on your learning progress.`,
      projectRequirements: requirements,
      submissionType: "link" as SubmissionType, // Default to link submission
      resources: [
        {
          title: "Course Materials",
          url: `/course/${args.courseId}`,
          type: "reference"
        }
      ],
      deadline: now + (7 * 24 * 60 * 60 * 1000), // 1 week deadline
      createdAt: now,
      difficulty: args.difficulty as DifficultyLevel, // Use provided difficulty
      estimatedTime: 180, // Placeholder: 3 hours
      passingScore: 70, // Placeholder
      allowRetries: true, // Placeholder
      maxRetries: 3 // Placeholder
    });

    // Create progress record for this assessment
    await ctx.db.insert("progress", {
      userId: args.userId,
      assessmentId,
      status: "not_started",
      startedAt: now, // Mark as started now?
      attemptNumber: 0 // No attempts yet
    });

    return {
      assessmentId,
      title: projectTitle,
      description: projectDescription,
      requirements,
      deadline: now + (7 * 24 * 60 * 60 * 1000)
    };
  }
});