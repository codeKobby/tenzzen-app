import { generateObject, generateText } from "ai";
import { getModel, aiConfig } from "./config";
import { CourseOutlineSchema, QuizSchema } from "./types";
import { courseGenerationPrompts, quizGenerationPrompts, tutorPrompts, prompts, formatPrompt } from "./prompts";
import type { CourseOutline, Quiz } from "./types";

export class AIClient {
  /**
   * Generate a structured course outline from YouTube transcript and metadata
   * Following the detailed process from COURSE_GENERATION_PROCESS.md
   */
  static async generateCourseOutline(params: {
    videoTitle: string;
    videoDescription: string;
    transcript: string;
    channelName: string;
  }): Promise<CourseOutline> {
    // Step 1: Initial content analysis
    const analysisPrompt = courseGenerationPrompts.contentAnalysis(
      params.transcript,
      {
        title: params.videoTitle,
        channelName: params.channelName,
        description: params.videoDescription
      }
    );

    const { text: analysisText } = await generateText({
      model: getModel("smart"),
      prompt: analysisPrompt,
      temperature: 0.3, // Lower temperature for analysis
    });

    // Step 2: Generate course structure based on analysis
    const structurePrompt = courseGenerationPrompts.courseStructure(
      { analysis: analysisText },
      params.transcript
    );

    const { object } = await generateObject({
      model: getModel("smart"),
      schema: CourseOutlineSchema,
      prompt: structurePrompt,
      temperature: aiConfig.parameters.temperature,
    });

    return object;
  }

  /**
   * Generate a quiz for a specific lesson or module
   * Following educational assessment best practices
   */
  static async generateQuiz(params: {
    lessonTitle: string;
    lessonContent: string;
    numQuestions?: number;
    difficulty?: "easy" | "medium" | "hard" | "mixed";
  }): Promise<Quiz> {
    const {
      lessonTitle,
      lessonContent,
      numQuestions = 5,
      difficulty = "mixed",
    } = params;

    const prompt = quizGenerationPrompts.multipleChoice(
      {
        title: lessonTitle,
        content: lessonContent,
        difficulty,
        numQuestions
      },
      {} // Empty context for now, can be expanded
    );

    const { object } = await generateObject({
      model: getModel("default"),
      schema: QuizSchema,
      prompt,
      temperature: 0.8,
    });

    return object;
  }

  /**
   * Generate a summary of content with educational focus
   */
  static async generateSummary(params: {
    content: string;
    maxLength?: number;
  }): Promise<string> {
    const { content, maxLength = 500 } = params;

    const prompt = `You are an educational content specialist. Create a concise, educational summary of the following content.

Content to summarize:
${content}

Summary requirements:
- Capture key educational concepts and learning points
- Maintain technical accuracy
- Focus on actionable insights
- Keep under ${maxLength} characters
- Use clear, educational language

Provide a focused summary that would be valuable for learners.`;

    const { text } = await generateText({
      model: getModel("fast"),
      prompt,
      temperature: 0.5,
    });

    return text;
  }

  /**
   * Expand or continue generating course content
   * Following the course development process
   */
  static async expandCourse(params: {
    existingCourse: CourseOutline;
    additionalContext: string;
  }): Promise<CourseOutline> {
    const prompt = `You are an expert curriculum developer expanding an existing course. Here's the current course structure:

EXISTING COURSE:
${JSON.stringify(params.existingCourse, null, 2)}

ADDITIONAL CONTEXT TO INCORPORATE:
${params.additionalContext}

EXPANSION REQUIREMENTS:

1. **Content Enhancement**
   - Deepen explanations of complex concepts
   - Add more detailed examples and use cases
   - Include additional learning activities
   - Expand on practical applications

2. **Structural Improvements**
   - Add new modules if content justifies it
   - Create additional lessons within existing modules
   - Improve learning progression and flow
   - Add assessment and practice opportunities

3. **Educational Quality**
   - Ensure comprehensive coverage of topics
   - Maintain appropriate difficulty progression
   - Include real-world examples and applications
   - Add supplementary materials planning

4. **Learning Experience**
   - Include interactive elements planning
   - Add review and reinforcement activities
   - Plan for different learning styles
   - Ensure accessibility considerations

Return the complete, enhanced course structure with all improvements integrated.`;

    const { object } = await generateObject({
      model: getModel("smart"),
      schema: CourseOutlineSchema,
      prompt,
      temperature: 0.7,
    });

    return object;
  }

  /**
   * Generate supplementary content for a course segment
   * Following the detailed supplementary content generation process
   */
  static async generateSupplementaryContent(params: {
    segment: any;
    courseContext: any;
  }) {
    const prompt = courseGenerationPrompts.supplementaryContent(
      params.segment,
      params.courseContext
    );

    const { text } = await generateText({
      model: getModel("default"),
      prompt,
      temperature: 0.7,
    });

    return text;
  }

  /**
   * Provide contextual AI tutoring response
   */
  static async generateTutorResponse(params: {
    question: string;
    courseContext: any;
    chatHistory: any[];
  }): Promise<string> {
    const prompt = tutorPrompts.contextualResponse(
      params.question,
      params.courseContext,
      params.chatHistory
    );

    const { text } = await generateText({
      model: getModel("default"),
      prompt,
      temperature: 0.8,
    });

    return text;
  }

  /**
   * Explain a specific concept in course context
   */
  static async explainConcept(params: {
    concept: string;
    courseContext: any;
  }): Promise<string> {
    const prompt = tutorPrompts.conceptExplanation(
      params.concept,
      params.courseContext
    );

    const { text } = await generateText({
      model: getModel("default"),
      prompt,
      temperature: 0.7,
    });

    return text;
  }
}
