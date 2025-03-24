import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message, StreamData } from 'ai';
import { createStreamableUI } from 'ai/rsc';
import { getYoutubeTranscript } from '@/actions/getYoutubeTranscript';
import { getVideoDetails, getPlaylistDetails } from '@/actions/getYoutubeData';
import { mockCourseData } from '@/lib/mock/course-data';
import { mockSources } from '@/lib/mock/sources';
import { generateSystemPrompt } from './prompts';
import { CourseGenerationProgress } from './types';

export async function generateCourse(
  videoData: any,
  options: {
    temperature?: number;
    maxOutputTokens?: number;
    onProgress?: (progress: CourseGenerationProgress) => void;
    signal?: AbortSignal;
  } = {}
) {
  const {
    temperature = 0.7,
    maxOutputTokens = 8192,
    onProgress,
    signal
  } = options;
  
  try {
    // Check for abort signal
    if (signal?.aborted) {
      throw new Error('Course generation cancelled');
    }
    
    // 1. Report progress: Starting
    onProgress?.({ 
      step: 'initializing', 
      progress: 5, 
      message: "Initializing course generation..." 
    });
    
    // 2. Determine if we're dealing with a video or playlist
    const videoId = videoData.id;
    const videoType = videoData.type || 'video';
    
    // 3. Report progress: Fetching transcript
    onProgress?.({ 
      step: 'fetching_transcript', 
      progress: 15, 
      message: "Fetching video transcript..." 
    });
    
    // 4. Get transcript for analysis (only if not in mock/development mode)
    let transcript = [];
    if (process.env.NODE_ENV !== 'development' || process.env.USE_LIVE_DATA === 'true') {
      transcript = await getYoutubeTranscript(videoId);
    }
    
    // Check for abort signal again after transcript fetch
    if (signal?.aborted) {
      throw new Error('Course generation cancelled');
    }
    
    // 5. Report progress: Analyzing content
    onProgress?.({ 
      step: 'analyzing', 
      progress: 25, 
      message: "Analyzing video content..." 
    });
    
    // 6. Use Vercel AI SDK with Google Generative AI to generate course structure
    // First check if we're in development mode and should use mock data
    if (process.env.NODE_ENV === 'development' && process.env.MOCK_AI === 'true') {
      // Simulate generation delay
      const mockProgress = async () => {
        if (signal?.aborted) throw new Error('Course generation cancelled');
        onProgress?.({ step: 'generating', progress: 35, message: "Generating course outline..." });
        await new Promise(r => setTimeout(r, 800));
        if (signal?.aborted) throw new Error('Course generation cancelled');
        onProgress?.({ step: 'generating', progress: 55, message: "Creating lessons and sections..." });
        await new Promise(r => setTimeout(r, 800));
        if (signal?.aborted) throw new Error('Course generation cancelled');
        onProgress?.({ step: 'generating', progress: 75, message: "Adding resources and metadata..." });
        await new Promise(r => setTimeout(r, 800));
        if (signal?.aborted) throw new Error('Course generation cancelled');
        onProgress?.({ step: 'finalizing', progress: 95, message: "Finalizing course structure..." });
        await new Promise(r => setTimeout(r, 500));
      };
      
      await mockProgress();
      
      // Return mock course data
      const customizedMockData = {
        ...mockCourseData,
        title: videoData.title || mockCourseData.title,
        description: videoData.description || mockCourseData.description,
        videoId: videoId,
        thumbnail: videoData.thumbnail || mockCourseData.thumbnail,
        metadata: {
          ...mockCourseData.metadata,
          sources: mockSources
        }
      };
      
      onProgress?.({ step: 'completed', progress: 100, message: "Course generation complete!" });
      return customizedMockData;
    }
    
    // Prepare for actual generation with Google AI
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro-latest',
      safetySettings: [
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ]
    });
    
    // Create system prompt
    const systemPrompt = generateSystemPrompt(videoType);
    
    // Prepare the prompt with video metadata and transcript
    const promptData = {
      videoId: videoId,
      title: videoData.title,
      description: videoData.description || '',
      duration: videoData.duration || '',
      type: videoType,
      transcript: transcript.slice(0, 500), // Limit transcript size for prompt
      ...(videoType === 'playlist' && { 
        videos: videoData.videos?.map((v: any) => ({
          title: v.title,
          description: v.description || '',
          duration: v.duration || ''
        })) || [] 
      })
    };
    
    // Report progress: Generating course
    onProgress?.({ step: 'generating', progress: 40, message: "Generating course outline..." });
    
    // Execute the generation
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: JSON.stringify(promptData) }] },
        { role: 'model', parts: [{ text: systemPrompt }] }
      ],
      generationConfig: {
        temperature,
        topK: 40,
        topP: 0.95,
        maxOutputTokens,
        responseFormat: { type: 'json' }
      }
    });
    
    // Check for abort signal after generation
    if (signal?.aborted) {
      throw new Error('Course generation cancelled');
    }
    
    // Update progress
    onProgress?.({ step: 'structuring', progress: 70, message: "Structuring course content..." });
    
    // Parse the response
    const responseText = result.response.text();
    let courseData;
    
    try {
      courseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fall back to mock data on error
      courseData = mockCourseData;
    }
    
    // Enrich the course data with needed fields for UI
    const enrichedCourse = {
      ...courseData,
      videoId: videoId,
      thumbnail: videoData.thumbnail || "/placeholders/course-thumbnail.jpg",
      metadata: {
        ...courseData.metadata,
        sources: mockSources,
        category: courseData.metadata?.category || "Programming",
        difficulty: courseData.metadata?.difficulty || "Beginner",
        duration: courseData.metadata?.duration || "6 weeks"
      },
      // Make sure each section has the required fields
      sections: courseData.sections?.map((section: any, sectionIndex: number) => ({
        ...section,
        id: section.id || `section-${sectionIndex + 1}`,
        lessons: section.lessons?.map((lesson: any, lessonIndex: number) => ({
          ...lesson,
          id: lesson.id || `lesson-${sectionIndex + 1}-${lessonIndex + 1}`,
          resources: lesson.resources || []
        }))
      })) || []
    };
    
    // Final progress update
    onProgress?.({ step: 'completed', progress: 100, message: "Course generation complete!" });
    
    return enrichedCourse;
  } catch (error) {
    // If the operation was cancelled, pass along the cancellation message
    if (signal?.aborted || (error instanceof Error && error.message.includes('cancelled'))) {
      throw new Error('Course generation cancelled');
    }
    
    // For other errors, provide more context
    console.error("Course generation error:", error);
    throw new Error(`Failed to generate course: ${error instanceof Error ? error.message : String(error)}`);
  }
}
