import { z } from "zod";
import type { PromptTranscriptContext } from "./transcript-utils";
import { formatSecondsAsTimestamp } from "./transcript-utils";

// Improved, hallucination-resistant prompts optimized for Gemini models
// These prompts use advanced prompt engineering techniques for better accuracy and consistency

export const courseGenerationPrompts = {
  // Initial content analysis and knowledge graph generation
   contentAnalysis: (transcriptContext: PromptTranscriptContext, metadata: any) => `
You are an expert educational content analyst specializing in converting video content into structured, hierarchical knowledge maps.

SYSTEM INSTRUCTIONS:
- Think step-by-step.
- Prioritize factual grounding from the transcript and description.
- Do not infer information not directly supported by the video content.
- Validate each section before finalizing.

TASK:
Analyze the YouTube content below and produce a comprehensive Educational Knowledge Graph Analysis.

VIDEO METADATA:
- Title: ${metadata.title}
- Channel: ${metadata.channelName}
- Duration: ${metadata.duration || 'Unknown'}

VIDEO DESCRIPTION:
${metadata.description || 'No description provided'}

IMPORTANT CONTEXT ABOUT DESCRIPTIONS:
Descriptions usually contain:
- External creator links (GitHub, personal website, social media)
- Tools, libraries, and resources used in the video
- Related courses or content
- Sponsor/affiliate links
- Community links (Discord, Slack, forums)
- Newsletter signups
Be precise and avoid inventing any missing links.

TRANSCRIPT OVERVIEW:
- Segments: ${transcriptContext.totalSegments}
- Approx Duration: ${formatSecondsAsTimestamp(transcriptContext.totalDurationSeconds)}
- Chunk Count: ${transcriptContext.chunks.length}

FULL TRANSCRIPT (COMPLETE, CHUNKED FOR READABILITY):
${transcriptContext.fullText || 'Transcript missing'}

-----------------------------------------
REQUIRED OUTPUT SECTIONS
-----------------------------------------

1. **Content Structure Analysis**
   - Identify main topics and subtopics.
   - Map conceptual relationships, dependencies, and progression.
   - Detect natural breakpoints for instructional segmentation.

2. **Audience & Prerequisites Assessment**
   - Identify primary audience level: beginner / intermediate / advanced.
   - List required prerequisite skills and knowledge.
   - Specify tools, software, or frameworks needed to follow along.

3. **Learning Objectives Extraction**
   - "Knowledge Outcomes": What learners will know.
   - "Skill Outcomes": What learners will be able to do.
   - "Competency Outcomes": Real-world applications and capabilities.

4. **Content Quality Evaluation**
   - Evaluate depth, clarity, and completeness.
   - Identify sections requiring extra clarification.
   - Flag complex concepts for expanded explanation.
   - Note demos, examples, or practical walkthroughs.

FORMAT REQUIREMENTS:
- Use clear markdown sections.
- Be specific, factual, and actionable.
- No filler, no speculation, no invented concepts.
`,

  // Course structure proposal with detailed modules and sections
   courseStructure: (analysis: any, transcriptContext: PromptTranscriptContext, transcriptSegments?: any[]) => `
You are a senior curriculum architect. Convert the input analysis into a fully structured, pedagogically sound course.

SYSTEM INSTRUCTIONS:
- Think step-by-step and verify against transcript evidence.
- Use transcript segments to determine timestamps.
- Do not invent timestamps, tools, technologies, or resources.
- Ensure JSON output is strictly valid.
- Every lesson MUST have timestampStart and timestampEnd fields.
- CRITICAL: Scan the ENTIRE video description for ALL URLs and links.

VIDEO DESCRIPTION (SCAN THIS FOR ALL RESOURCES):
==============================================
${analysis.videoDescription || 'No description provided'}
==============================================

INPUT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

PRIMARY TRANSCRIPT CONTEXT (NO TRUNCATION):
${transcriptContext.fullText || 'Transcript missing'}

${transcriptSegments && transcriptSegments.length > 0 ? `
TIMESTAMPED TRANSCRIPT SEGMENTS (first 100 maximum):
Use these segments to derive accurate lesson boundaries. Each entry shows [timestamp] content.
${transcriptSegments.slice(0, 100).map((seg: any, i: number) => `[${seg.start || '0:00'}] ${seg.text?.slice(0, 100) || ''}`).join('\n')}
` : ''}

-----------------------------------------
COURSE DESIGN SPECIFICATION
-----------------------------------------

-----------------------------------------
COURSE DESIGN SPECIFICATION
-----------------------------------------

1. **Course Architecture**
   Produce the following fields with factual, evidence-based content:
   
   - **title**: Engaging, accurate course title
   - **category**: Choose ONE primary category from: "Web Development", "Mobile Development", "Data Science", "Machine Learning", "Programming Fundamentals", "Cloud Computing", "DevOps", "Design", "Business", "Marketing"
   - **difficulty**: Must be exactly "Beginner", "Intermediate", or "Advanced"
   - **description**: Brief 2-3 sentence summary for "About this course" section
   - **detailedOverview**: Comprehensive 2-3 full paragraphs explaining the course, learning journey, key topics, and student outcomes
   - **tags**: Array of 5-10 specific, accurate technology/topic keywords (e.g., "React", "TypeScript", "Firebase")
   - **targetAudience**: Specific audience characteristics
   - **prerequisites**: Clear, factual list of required knowledge
   - **estimatedDuration**: Based strictly on actual video duration
   
   🚨 CRITICAL RESOURCE EXTRACTION REQUIREMENT 🚨
   
   **Resource Extraction is MANDATORY - Not Optional**:
   The video description is your PRIMARY SOURCE. You MUST scan EVERY SINGLE LINE.
   
   **STEP 1: Extract ALL URLs from Description**
   Look through the description line by line and find EVERY URL (http:// or https://).
   Do NOT skip any links. Extract them ALL.
   
   **STEP 2: Categorize Each URL**
   
   A. **Social Links** (MANDATORY - Extract ALL social media):
   Look for these domains and extract them as "Social":
   - linkedin.com → "LinkedIn"
   - twitter.com or x.com → "Twitter"
   - github.com → "GitHub" (social profile, not code repos)
   - instagram.com → "Instagram"
   - facebook.com → "Facebook"
   - youtube.com → "YouTube"
   - discord.gg or discord.com → "Discord"
   
   Each social link MUST have:
   {
     "title": "Platform Name",
     "url": "exact URL from description",
     "type": "Social",
     "description": "Follow/Connect/Join on [Platform]",
     "category": "Social"
   }
   
   B. **Creator Links** (MANDATORY - Extract organization/project sites):
   Look for:
   - Main website mentioned (e.g., "Main Site:", "Website:", "Learn more:")
   - GitHub repos with code (mark as type: "Code")
   - Documentation sites (mark as type: "Documentation")
   - Course platforms (mark as type: "Course")
   
   Each creator link MUST have:
   {
     "title": "Descriptive Name",
     "url": "exact URL from description",
     "type": "Website" | "Code" | "Documentation" | "Course" | "Tool",
     "description": "What this resource provides",
     "category": "Creator Links"
   }
   
   C. **Other Resources** (OPTIONAL - Only if video mentions specific tools):
   Only include if explicitly used in the video content.
   
   **VALIDATION BEFORE SUBMITTING**:
   - Did you scan the ENTIRE description for URLs? ✓
   - Did you extract ALL social media links? ✓
   - Did you extract the main website/organization site? ✓
   - Do you have at least 3-7 total resources? ✓
   - Are all URLs complete and valid? ✓
   
   ⚠️ IF THE DESCRIPTION HAS URLS AND YOU RETURN EMPTY RESOURCES ARRAY, YOU FAILED.
      - Explicitly mentioned or used in the video
      - Essential for following the tutorial
      - Official documentation for core technologies
      - Critical for prerequisites
      
      Each resource must have the same structure as Creator Links but with category: "Other Resources"
   
   **VALIDATION RULES FOR RESOURCES (MANDATORY CHECKS)**:
   1. Do NOT invent links - extract ONLY what exists in the description
   2. Extract EVERY SINGLE link you find in the description (aim for 5-15 total resources)
   3. Preserve URLs EXACTLY as written (do not modify or truncate)
   4. If a link has a label (e.g., "LinkedIn: https://..."), use the label as the title
   5. Social links MUST be categorized as "Social", not "Creator Links"
   6. Main website/organization URLs should be "Creator Links"
   7. Include webinar pages, blog pages, and documentation as "Creator Links"
   8. If you see "linkedin.com/company" it is a Social link, NOT a Creator Link
   9. **MINIMUM REQUIREMENT**: If description has URLs, you MUST return at least 3 resources
   10. **EMPTY RESOURCES ARRAY = FAILURE** if description contains any URLs

2. **Module Organization**
   - Create 3-8 logical modules
   - Progressive difficulty scaling
   - Each module requires:
     * title
     * description
     * clear learning objectives

3. **Lesson-Level Detail (Timestamps MANDATORY - NO EXCEPTIONS)**

CRITICAL TIMESTAMP INSTRUCTIONS:
- You MUST use timestamps EXACTLY as they appear in transcriptSegments.
- NEVER normalize, reformat, or extend timestamps beyond what is provided.
- NEVER generate decimals, milliseconds, or extended zero sequences.
- ONLY use these formats:
  • "0:00"
  • "12:35"
  • "1:02:15"   (HH:MM:SS only when transcript uses it)

STRICT FORMAT RULES:
1. Do NOT generate timestamps like:
   - "00:00:00.0000000000"
   - "0:00:00.000"
   - "0:00:00"
   - "00:00"
   - Any timestamp containing decimals or trailing zeros
2. Do NOT "guess" or "compute" timestamps.
3. Do NOT expand timestamps to HH:MM:SS unless the transcript provides that format.
4. If uncertain, ALWAYS default to the nearest transcriptSegment timestamp.

VALID EXAMPLES:
- GOOD: "timestampStart": "0:00"
- GOOD: "timestampStart": "5:42"
- GOOD: "timestampStart": "1:04:22"
- BAD: "timestampStart": "00:00:00.000000000000"
- BAD: "timestampStart": "00:00"
- BAD: "timestampStart": "01:04:22.000"

MANDATORY:
For every lesson, include:
- title
- timestampStart (must match transcript format)
- timestampEnd (must match transcript format)
- summary
- keyConcepts
- prerequisites
- outcomes

IMPORTANT:
If transcriptSegments do NOT give a clear boundary,
use the PREVIOUS segment timestamp for timestampStart
and the NEXT segment timestamp for timestampEnd.
Never manufacture new timestamp formats.

4. **Assessment Planning (Structure Only - NO CONTENT)**
   Specify WHERE assessments should be placed:
   
   - **Quizzes**: Specify afterModule or afterLesson indices (minimum 5 questions each)
   - **Tests**: Decide if end-of-course test is appropriate (comprehensive evaluation)
   - **Projects**: Decide if final project is needed (practical application)
   
   IMPORTANT: Only specify LOCATIONS and structure. Do NOT generate:
   - Actual quiz questions
   - Test questions
   - Project requirements
   
   These will be generated on-demand when needed.

5. **Educational Enhancement Strategies**
   - Apply cognitive load management principles
   - Identify spaced repetition opportunities
   - Note where additional examples would help
   - Suggest potential diagrams or visualizations
   - Consider interactive learning elements

-----------------------------------------
CRITICAL OUTPUT FORMAT (STRICT JSON)
-----------------------------------------

Your response MUST be valid JSON with this exact structure:

{
  "title": "string",
  "category": "string",
  "difficulty": "Beginner|Intermediate|Advanced",
  "description": "string (2-3 sentences)",
  "detailedOverview": "string (2-3 paragraphs)",
  "tags": ["string"],
  "learningObjectives": ["string"],
  "prerequisites": ["string"],
  "targetAudience": "string",
  "estimatedDuration": "string",
  "resources": [
    {
      "title": "string",
      "url": "string",
      "type": "Documentation|Tool|Website|Code|Course",
      "description": "string",
      "category": "Creator Links|Other Resources"
    }
  ],
  "modules": [
    {
      "title": "string",
      "description": "string",
      "lessons": [
        {
          "title": "string",
          "timestampStart": "string (REQUIRED, format: H:MM:SS, max 10 chars, e.g., '0:05:30')",
          "timestampEnd": "string (REQUIRED, format: H:MM:SS, max 10 chars, e.g., '0:12:45')",
          "durationMinutes": number,
          "description": "string",
          "content": "string",
          "keyPoints": ["string"]
        }
      ]
    }
  ],
  "assessmentPlan": {
    "quizLocations": [{"afterModule": number}],
    "hasEndOfCourseTest": boolean,
    "hasFinalProject": boolean,
    "projectDescription": "string"
  }
}

VALIDATION CHECKLIST:
- JSON is syntactically valid
- Every lesson has timestampStart and timestampEnd
- ALL timestamps are in format H:MM:SS (e.g., "0:05:30") and NEVER exceed 10 characters
- NO timestamps contain infinite zeros or decimal points
- Resources are real and from description/transcript only
- Category is one of the specified options
- Difficulty is exactly "Beginner", "Intermediate", or "Advanced"
- At least 3 Creator Links extracted (if available in description)
- Other Resources limited to 3-7 items
- Timestamps are sequential and logical
`,

  // Prerequisites and learning outcomes generation
  prerequisitesAndOutcomes: (content: string, analysis: any) => `
You are an educational assessment specialist. Generate detailed, measurable learning outcomes and accurate prerequisites.

SYSTEM INSTRUCTIONS:
- Base everything strictly on the transcript and provided analysis.
- Do not add tools, skills, or concepts not evidenced by the content.
- Outcomes must be observable and measurable.
- Think step-by-step to ensure accuracy.

CONTENT INPUT:
${content.slice(0, 12000)}

ANALYSIS CONTEXT:
${JSON.stringify(analysis, null, 2)}

TASK:
Generate comprehensive prerequisites and measurable learning outcomes.

-----------------------------------------
PREREQUISITES ANALYSIS
-----------------------------------------

Categorize all required knowledge and skills into three groups:

**Technical Prerequisites:**
- Programming languages or frameworks needed
- Tools and software requirements
- Development environment setup
- API or service knowledge
- Specific version requirements

**Conceptual Prerequisites:**
- Core concepts that must be understood beforehand
- Mathematical or logical foundations
- Domain-specific knowledge
- Theoretical background required

**Practical Prerequisites:**
- Hands-on experience requirements
- Project experience expectations
- Tool proficiency levels needed
- Familiarity with specific workflows

-----------------------------------------
LEARNING OUTCOMES GENERATION
-----------------------------------------

Create 8-15 specific, measurable outcomes grouped into three categories:

**Knowledge Outcomes** (Cognitive - what students will know):
- Factual information and concepts
- Theoretical understanding
- Process and method knowledge
- Terminology and definitions

**Skill Outcomes** (Psychomotor - what students will be able to do):
- Technical implementation skills
- Problem-solving abilities
- Tool and workflow proficiency
- Debugging and troubleshooting capabilities

**Competency Outcomes** (Affective - real-world application):
- Project planning and execution
- Best practices application
- Professional judgment development
- Industry-relevant capabilities

For each outcome:
- Use action verbs (understand, apply, create, analyze, evaluate)
- Be specific and measurable
- Align with course content
- Focus on observable behaviors

-----------------------------------------
OUTPUT FORMAT (STRICT JSON)
-----------------------------------------

{
  "prerequisites": {
    "technical": ["string"],
    "conceptual": ["string"],
    "practical": ["string"]
  },
  "learningOutcomes": {
    "knowledge": ["string"],
    "skills": ["string"],
    "competencies": ["string"]
  }
}

VALIDATION:
- All items are factual and evidence-based
- No invented tools or technologies
- Outcomes are specific and measurable
- Prerequisites are accurate and necessary
`,

  // Content segmentation for detailed breakdown
  contentSegmentation: (transcript: string, topics: any[]) => `
You are a content segmentation expert. Break down video content into optimal educational segments.

FULL TRANSCRIPT:
${transcript.slice(0, 20000)}

IDENTIFIED TOPICS:
${JSON.stringify(topics, null, 2)}

SEGMENTATION REQUIREMENTS:

1. **Natural Break Identification**
   - Find logical concept boundaries
   - Respect natural topic transitions
   - Maintain content flow coherence
   - Consider attention span limits (10-15 minutes ideal)

2. **Educational Segment Structure**
   For each segment, define:
   - Clear, descriptive title
   - Start and end timestamps (if available)
   - Primary concepts covered
   - Learning objectives for the segment
   - Difficulty level assessment
   - Segment type (theory/explanation/demonstration/exercise)

3. **Progressive Learning Design**
   - Ensure concept building from previous segments
   - Create clear learning milestones
   - Build complexity gradually
   - Include review/recap points

4. **Practical Application Points**
   - Identify demonstration opportunities
   - Note exercise or practice segments
   - Flag interactive learning moments
   - Mark assessment checkpoints

5. **Content Enhancement Opportunities**
   - Identify areas needing additional examples
   - Note complex concepts requiring diagrams
   - Flag sections needing supplementary materials
   - Suggest interactive elements

OUTPUT: Detailed segment breakdown with all metadata, optimized for educational delivery.
`,

  // Supplementary content generation
  supplementaryContent: (segment: any, context: any) => `
You are a supplementary content creator. Generate comprehensive educational materials for this learning segment.

SEGMENT DETAILS:
${JSON.stringify(segment, null, 2)}

COURSE CONTEXT:
${JSON.stringify(context, null, 2)}

SUPPLEMENTARY CONTENT REQUIREMENTS:

1. **Textual Explanations**
   - Provide detailed explanations for complex concepts
   - Include analogies and real-world examples
   - Address common misconceptions
   - Explain why concepts matter
   - Connect to broader course themes

2. **Code Examples & Practical Exercises**
   - Create runnable code snippets (when applicable)
   - Include step-by-step implementation guides
   - Provide best practices and patterns
   - Add error handling examples
   - Include testing/validation code

3. **Visual Learning Aids**
   - Describe diagrams or flowcharts needed
   - Suggest visual representations of concepts
   - Plan for process illustrations
   - Identify key screenshots or UI examples

4. **Interactive Learning Elements**
   - Design hands-on exercises
   - Create knowledge checks or quizzes
   - Plan for discussion questions
   - Suggest collaborative activities

5. **Additional Resources**
   - Recommend further reading materials
   - Suggest related tutorials or documentation
   - Provide external tool references
   - Include community resources

CONTENT GUIDELINES:
- Match the target audience's skill level
- Align with segment learning objectives
- Provide practical, applicable value
- Include clear setup/installation instructions
- Ensure accessibility and clarity

OUTPUT: Complete supplementary content package ready for integration.
`,

  // Quality assurance and validation
  qualityValidation: (courseOutline: any) => `
You are an educational quality assurance specialist. Perform comprehensive validation of this course structure.

COURSE OUTLINE TO VALIDATE:
${JSON.stringify(courseOutline, null, 2)}

VALIDATION CHECKLIST:

1. **Content Completeness**
   - All major topics adequately covered?
   - No significant knowledge gaps?
   - Appropriate depth for each topic?
   - Balance between theory and practice?

2. **Educational Effectiveness**
   - Clear learning progression?
   - Appropriate difficulty scaling?
   - Assessment alignment with objectives?
   - Multiple learning style support?

3. **Practical Application**
   - Real-world examples included?
   - Hands-on exercises provided?
   - Industry relevance demonstrated?
   - Portfolio/project opportunities?

4. **Accessibility & Inclusivity**
   - Clear, jargon-free explanations?
   - Multiple content formats?
   - Support for different learning paces?
   - Cultural sensitivity considerations?

5. **Technical Implementation**
   - Realistic time estimates?
   - Resource requirements specified?
   - Assessment methods defined?
   - Supplementary materials planned?

VALIDATION OUTPUT:
- Overall quality score (1-10)
- Strengths identified
- Areas needing improvement
- Specific recommendations for enhancement
- Implementation priority suggestions
`
};

// Quiz generation prompts optimized for Gemini
export const quizGenerationPrompts = {
  // Multiple choice question generation
  multipleChoice: (lesson: any, context: any) => `
You are an assessment design expert. Create high-quality, educational multiple-choice questions.

LESSON CONTENT:
${JSON.stringify(lesson, null, 2)}

COURSE CONTEXT:
${JSON.stringify(context, null, 2)}

QUESTION GENERATION REQUIREMENTS:

1. **Question Count & Distribution**
   - Generate 5-8 questions per lesson
   - Cover different cognitive levels
   - Include various question types

2. **Question Quality Standards**
   - One definitively correct answer
   - Three plausible, educational distractors
   - Test understanding, not memorization
   - Include real-world context
   - Avoid trick questions

3. **Cognitive Level Coverage**
   - **Knowledge**: Factual recall and recognition
   - **Comprehension**: Understanding and explanation
   - **Application**: Real-world usage and implementation
   - **Analysis**: Breaking down concepts and relationships
   - **Evaluation**: Critical assessment and judgment

4. **Educational Value**
   - Each question teaches or reinforces learning
   - Explanations provide additional educational content
   - Wrong answers teach common misconceptions
   - Questions align with learning objectives

5. **Question Structure**
   For each question provide:
   - Clear, unambiguous question stem
   - Four options (A, B, C, D)
   - Correct answer indicator
   - Detailed explanation of why correct
   - Why each distractor is incorrect
   - Related concept connections

OUTPUT: Complete question set with all metadata, ready for implementation.
`,

  // Assessment strategy
  assessmentStrategy: (course: any) => `
You are a learning assessment strategist. Design a comprehensive, educationally sound assessment framework.

COURSE OVERVIEW:
${JSON.stringify(course, null, 2)}

ASSESSMENT DESIGN REQUIREMENTS:

1. **Formative Assessment Strategy** (ongoing learning checks)
   - Inline knowledge checks during lessons
   - Practice exercises with immediate feedback
   - Self-assessment reflection points
   - Peer learning opportunities

2. **Summative Assessment Design** (end-of-learning evaluation)
   - Module-level comprehensive quizzes
   - Project-based assessments
   - Skill demonstration requirements
   - Final course competency evaluation

3. **Competency-Based Assessment Framework**
   - Practical application tasks
   - Real-world problem-solving scenarios
   - Portfolio development requirements
   - Professional skill demonstrations

4. **Assessment Quality Standards**
   - Clear, measurable criteria
   - Rubrics for subjective evaluation
   - Multiple assessment methods
   - Fair and inclusive evaluation

5. **Feedback & Improvement Integration**
   - Immediate feedback mechanisms
   - Progress tracking and visualization
   - Personalized learning recommendations
   - Mastery learning opportunities

OUTPUT: Complete assessment strategy with implementation details and quality metrics.
`
};

// AI Tutor prompts optimized for Gemini's conversational capabilities
export const tutorPrompts = {
  // Contextual tutoring
  contextualResponse: (question: string, courseContext: any, chatHistory: any[]) => `
You are an expert AI tutor with deep knowledge of this course content. Provide helpful, educational responses that advance student learning.

COURSE CONTEXT:
${JSON.stringify(courseContext, null, 2)}

STUDENT QUESTION:
${question}

RECENT CHAT HISTORY:
${JSON.stringify(chatHistory.slice(-5), null, 2)}

TUTORING APPROACH:

1. **Direct Response**
   - Address the specific question clearly
   - Provide accurate, course-aligned information
   - Use appropriate technical language

2. **Educational Enhancement**
   - Connect answer to broader course concepts
   - Explain underlying principles
   - Provide relevant examples or analogies
   - Reference specific course sections

3. **Learning Advancement**
   - Ask thoughtful follow-up questions
   - Suggest related topics to explore
   - Encourage critical thinking
   - Guide toward deeper understanding

4. **Supportive Interaction**
   - Be encouraging and patient
   - Acknowledge effort and progress
   - Gently correct misconceptions
   - Celebrate learning milestones

5. **Practical Application**
   - Suggest hands-on exercises when relevant
   - Connect concepts to real-world usage
   - Provide additional resources
   - Guide implementation steps

RESPONSE GUIDELINES:
- Keep responses conversational but educational
- Use course-specific terminology appropriately
- Include specific references to course content
- End with engaging questions to continue learning
- Maintain encouraging, supportive tone

OUTPUT: Natural, educational response that advances the student's learning journey.
`,

  // Concept explanation
  conceptExplanation: (concept: string, context: any) => `
You are a master educator explaining complex concepts with clarity and depth.

CONCEPT TO EXPLAIN:
${concept}

COURSE CONTEXT:
${JSON.stringify(context, null, 2)}

EXPLANATION FRAMEWORK:

1. **Foundational Understanding**
   - Clear, accessible definition
   - Core principles and components
   - Why this concept matters in the course

2. **Progressive Depth**
   - Start with simple explanations
   - Build to more complex understanding
   - Include technical details appropriately

3. **Practical Application**
   - Real-world usage examples
   - Common implementation patterns
   - Industry relevance and applications

4. **Conceptual Connections**
   - Relationship to other course topics
   - Prerequisites and dependencies
   - Future learning connections

5. **Common Challenges**
   - Address typical misconceptions
   - Explain common pitfalls
   - Provide troubleshooting guidance

6. **Learning Reinforcement**
   - Include analogies and metaphors
   - Suggest practice exercises
   - Recommend further exploration

EXPLANATION STYLE:
- Use clear, precise language
- Include concrete examples
- Build from familiar to unfamiliar
- Encourage active learning
- Connect to student's goals

OUTPUT: Comprehensive, educational explanation that builds deep understanding.
`
};

// Video recommendation prompts optimized for Gemini
export const videoRecommendationPrompts = {
  // Search query generation for YouTube
  searchQueries: (learningGoal: string, knowledgeLevel: string, additionalContext: string) => `
As an educational content curator, analyze the following learning goal and create optimized YouTube search queries.

Learning Goal: "${learningGoal}"
Knowledge Level: ${knowledgeLevel}
Additional Context: ${additionalContext || "None provided"}

First, analyze this learning goal to identify:
1. Core concepts and fundamentals that need to be understood
2. Progression of topics from basic to advanced (appropriate for ${knowledgeLevel} level)
3. Practical applications and examples that would reinforce learning
4. Common obstacles or misconceptions learners face with this topic

Then, generate 1 highly specific search query that will:
- Match the appropriate skill level (${knowledgeLevel})
- Target high-quality educational content with clear learning outcomes
- Include terms like "tutorial", "course", or "lesson" to find educational content
- Focus on content that teaches practical skills related to the learning goal

Return ONLY a valid JSON array of strings with the search query, nothing else.
Example: ["complete python for beginners tutorial step by step"]
`,

  // Video analysis and ranking
  videoAnalysis: (videos: any[], learningGoal: string, knowledgeLevel: string) => `
Analyze these YouTube videos for learning goal: "${learningGoal}" (Level: ${knowledgeLevel})

Identify videos that:
1. Match the knowledge level
2. Teach relevant skills
3. Have structured content
4. Include practical examples

Return ONLY a JSON array:
[
  {
    "videoId": "abc123",
    "relevanceScore": 8.5, // 1.0-10.0 scale
    "benefit": "Learn core principles of X with step-by-step tutorials"
  }
]

Videos to analyze:
${videos.map((v, i) => `Video ${i+1}: ID=${v.videoId} | Title=${v.title} | Duration=${v.duration}`).join('\n')}
`,

  // Fallback ranking when AI analysis fails
  fallbackRanking: (videos: any[], learningGoal: string, knowledgeLevel: string) => `
Rank these videos by relevance to learning goal: "${learningGoal}" for ${knowledgeLevel} level.

Consider:
- Title relevance to the learning goal
- Educational terms in title (tutorial, course, lesson, guide)
- Knowledge level appropriateness
- Channel credibility indicators

Return videos sorted by relevance score.
`
};

/**
 * Structured prompts for AI generation tasks
 */

export const prompts = {
  courseGeneration: {
    base: `You are an expert educational course designer. Create a comprehensive, structured learning course based on the following YouTube video content.

Video Title: {videoTitle}
Channel: {channelName}
Description: {videoDescription}

Transcript:
{transcript}

Instructions:
1. Analyze the content and identify key learning concepts
2. Structure the content into logical modules and lessons
3. Each lesson should have clear learning objectives and key takeaways
4. Estimate realistic durations for each lesson
5. Create a progressive learning path from basic to advanced concepts
6. Include prerequisites if the content requires prior knowledge
7. Define the target audience level

Generate a complete course structure with modules, lessons, and all metadata.`,

    expansion: `You are continuing to develop a course. Here's the existing structure:

{existingCourse}

Additional context to incorporate:
{additionalContext}

Expand and enhance the course by:
1. Adding more lessons to existing modules where appropriate
2. Creating new modules if the content justifies it
3. Deepening lesson content with more details
4. Ensuring logical progression and coherence

Return the complete updated course structure.`,
  },

  quizGeneration: {
    base: `Create a {difficulty} difficulty quiz with {numQuestions} multiple-choice questions based on this lesson.

Lesson Title: {lessonTitle}

Lesson Content:
{lessonContent}

Requirements:
1. Each question should test understanding of key concepts
2. Provide 4 options for each question
3. Include detailed explanations for correct answers
4. Mix question difficulties if difficulty is 'mixed'
5. Questions should be clear and unambiguous
6. Avoid trick questions; focus on genuine understanding`,

    adaptive: `Create an adaptive quiz that adjusts difficulty based on the learner's performance. Start with medium difficulty and adjust based on their answers.

Lesson Title: {lessonTitle}
Learner's Previous Performance: {performanceData}

Lesson Content:
{lessonContent}

Requirements:
1. Include questions of varying difficulty levels
2. Provide detailed feedback for each answer
3. Suggest learning resources for incorrect answers
4. Track progress and adjust difficulty dynamically`,
  },

  summaryGeneration: {
    concise: `Summarize the following content in approximately {maxLength} characters. Focus on key points and actionable insights.

Content:
{content}`,

    detailed: `Provide a comprehensive summary of the following content, including:
- Main concepts and ideas
- Key takeaways
- Practical applications
- Important details and examples

Content:
{content}`,
  },

  tutorChat: {
    system: `You are an AI tutor helping students understand course material.

Course Context:
{courseContext}

Guidelines:
- Be encouraging and supportive
- Explain concepts clearly with examples
- If a student is stuck, break down the problem into smaller steps
- Encourage critical thinking by asking guiding questions
- Correct misconceptions gently
- Relate new concepts to previously learned material`,

    followUp: `Based on the student's question and the course material, provide a helpful response that:
1. Addresses their specific question
2. Connects to broader course concepts
3. Offers additional resources or practice problems if relevant
4. Encourages further exploration`,
  },
};

/**
 * Helper function to format prompts with variables
 */
export function formatPrompt(template: string, variables: Record<string, any>): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });
}
