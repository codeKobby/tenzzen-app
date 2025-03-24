import { z } from 'zod';
import { tool } from 'ai';
import { logger } from '@/lib/ai/debug-logger';
import { getYoutubeTranscript, type TranscriptSegment } from '@/actions/getYoutubeTranscript';
import { getVideoDetails, getPlaylistDetails } from '@/actions/getYoutubeData';
import { identifyYoutubeIdType } from '@/lib/utils/youtube';

// Type for course resources
const resourceSchema = z.object({
  title: z.string().describe('Title of the resource'),
  url: z.string().url().describe('URL of the resource'),
  description: z.string().describe('Description of what the resource offers'),
  type: z.enum(['documentation', 'tutorial', 'article', 'video', 'code', 'blog']).describe('Type of resource')
});

// Schema for overview section
const overviewSchema = z.object({
  title: z.string().describe('Title of the course'),
  description: z.string().describe('Brief description of the course'),
  objectives: z.array(z.string()).describe('List of learning objectives'),
  prerequisites: z.array(z.string()).optional().describe('List of prerequisites'),
  duration: z.string().describe('Total duration of the course'),
  category: z.string().describe('Main category of the course (e.g., Programming, Data Science)'),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).describe('Difficulty level of the course'),
  sources: z.array(resourceSchema).optional().describe('Sources used to create the course')
});

// Schema for individual lessons
const lessonSchema = z.object({
  id: z.string().describe('Unique identifier for the lesson'),
  title: z.string().describe('Title of the lesson'),
  description: z.string().describe('Description of the lesson content'),
  content: z.string().optional().describe('Lesson content in markdown format'),
  duration: z.string().describe('Duration of the lesson'),
  videoTimestamp: z.number().optional().describe('Timestamp in the original video where this lesson starts'),
  keyPoints: z.array(z.string()).describe('Key points covered in the lesson'),
  resources: z.array(resourceSchema).optional().describe('Additional resources for the lesson')
});

// Schema for course sections
const sectionSchema = z.object({
  id: z.string().describe('Unique identifier for the section'),
  title: z.string().describe('Title of the section'),
  description: z.string().describe('Description of the section content'),
  lessons: z.array(lessonSchema).describe('Lessons in this section'),
  objectives: z.array(z.string()).optional().describe('Learning objectives for this section'),
  duration: z.string().describe('Estimated duration for the section')
});

// Complete course schema
const courseSchema = z.object({
  title: z.string().describe('Title of the course'),
  description: z.string().describe('Brief description of the course'),
  videoId: z.string().describe('ID of the main video'),
  image: z.string().optional().describe('Thumbnail image URL'),
  metadata: overviewSchema.describe('Detailed metadata about the course'),
  sections: z.array(sectionSchema).describe('Course sections containing lessons'),
  // Placeholders for assessments - these will be generated on demand
  assessments: z.array(z.object({
    type: z.enum(['quiz', 'project', 'test']),
    title: z.string(),
    description: z.string(),
    sectionId: z.string().optional().describe('Section this assessment is related to'),
    placeholder: z.boolean().default(true).describe('If true, questions will be generated on demand')
  })).optional().describe('Course assessments and tests')
});

export type CourseData = z.infer<typeof courseSchema>;

/**
 * Processes a transcript to extract structured sections and lessons
 */
async function processTranscript(transcript: TranscriptSegment[], videoTitle: string): Promise<{
  sections: z.infer<typeof sectionSchema>[];
  objectives: string[];
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}> {
  // This is a simplified implementation
  // In production, you would use more sophisticated AI analysis

  // Join transcript segments for analysis
  const fullText = transcript.map(segment => segment.text).join(' ');
  
  // Identify topical boundaries and natural sections
  // This is highly simplified - would use topic segmentation algorithms or LLM in production
  const sections: z.infer<typeof sectionSchema>[] = [];
  
  // Simple heuristic to split into 3-5 sections based on transcript length
  const segmentCount = transcript.length;
  const sectionCount = Math.min(Math.max(3, Math.floor(segmentCount / 30)), 5);
  const segmentsPerSection = Math.floor(segmentCount / sectionCount);
  
  // Create sections
  for (let i = 0; i < sectionCount; i++) {
    const startIdx = i * segmentsPerSection;
    const endIdx = i === sectionCount - 1 ? segmentCount : (i + 1) * segmentsPerSection;
    const sectionTranscript = transcript.slice(startIdx, endIdx);
    
    // Basic section title generation (would use more sophisticated techniques in production)
    let sectionTitle = `Section ${i + 1}`;
    if (i === 0) sectionTitle = "Introduction";
    else if (i === sectionCount - 1) sectionTitle = "Advanced Topics";
    else if (i === 1) sectionTitle = "Core Concepts";
    
    // Create 2-4 lessons per section
    const lessonCount = Math.min(Math.max(2, Math.floor(sectionTranscript.length / 10)), 4);
    const lessonsPerSection = Math.floor(sectionTranscript.length / lessonCount);
    
    const lessons: z.infer<typeof lessonSchema>[] = [];
    
    for (let j = 0; j < lessonCount; j++) {
      const lessonStartIdx = j * lessonsPerSection;
      const lessonEndIdx = j === lessonCount - 1 ? sectionTranscript.length : (j + 1) * lessonsPerSection;
      const lessonTranscript = sectionTranscript.slice(lessonStartIdx, lessonEndIdx);
      
      // Calculate the original video timestamp for this lesson
      const videoTimestamp = lessonTranscript[0]?.start || 0;
      
      lessons.push({
        id: `lesson-${i + 1}-${j + 1}`,
        title: `Lesson ${j + 1}: ${j === 0 ? 'Getting Started' : 'Advanced Topic ' + j}`,
        description: `Learn about important concepts in ${videoTitle}`,
        duration: `${Math.ceil(lessonTranscript.reduce((sum, seg) => sum + seg.duration, 0) / 60)} minutes`,
        videoTimestamp,
        keyPoints: ['Understanding key concepts', 'Practical application'],
        resources: []
      });
    }
    
    sections.push({
      id: `section-${i + 1}`,
      title: sectionTitle,
      description: `${sectionTitle} for ${videoTitle}`,
      lessons,
      objectives: ['Master fundamental concepts', 'Apply knowledge in practice'],
      duration: `${Math.ceil(sectionTranscript.reduce((sum, seg) => sum + seg.duration, 0) / 60)} minutes`
    });
  }
  
  // Default values - in production this would be AI-determined based on content
  const objectives = [
    'Understand key concepts in the video',
    'Apply the knowledge in practical scenarios',
    'Build a foundation for advanced learning'
  ];
  
  // Infer difficulty and category (simplified)
  let difficulty: 'Beginner' | 'Intermediate' | 'Advanced' = 'Intermediate';
  let category = 'Programming';
  
  // Basic keyword detection for difficulty
  if (fullText.toLowerCase().includes('beginner') || fullText.toLowerCase().includes('introduction')) {
    difficulty = 'Beginner';
  } else if (fullText.toLowerCase().includes('advanced') || fullText.toLowerCase().includes('complex')) {
    difficulty = 'Advanced';
  }
  
  // Basic keyword detection for category
  if (fullText.toLowerCase().includes('javascript') || fullText.toLowerCase().includes('python') || 
      fullText.toLowerCase().includes('coding') || fullText.toLowerCase().includes('programming')) {
    category = 'Programming';
  } else if (fullText.toLowerCase().includes('design') || fullText.toLowerCase().includes('ui') || 
             fullText.toLowerCase().includes('ux')) {
    category = 'Design';
  } else if (fullText.toLowerCase().includes('business') || fullText.toLowerCase().includes('marketing')) {
    category = 'Business';
  }
  
  return {
    sections,
    objectives,
    category,
    difficulty
  };
}

export const generateCourseFromVideo = tool({
  description: 'Generate a structured course from YouTube video content, organizing it into sections and lessons with clear learning objectives',
  parameters: z.object({
    videoUrl: z.string().describe('YouTube video URL or ID'),
    complexity: z.enum(['simple', 'detailed']).optional().describe('Level of detail for course generation'),
    style: z.enum(['academic', 'practical', 'mixed']).optional().describe('Teaching style preference')
  }),
  execute: async ({ videoUrl, complexity = 'detailed', style = 'mixed' }) => {
    try {
      logger.info('state', 'Starting course generation', {
        videoUrl,
        complexity,
        style
      });

      // Extract video ID from URL if needed
      const { type, id } = await identifyYoutubeIdType(videoUrl);
      
      if (!id) {
        throw new Error('Invalid YouTube video URL or ID');
      }
      
      // Fetch video details
      const videoDetails = await getVideoDetails(id);
      
      // Fetch video transcript
      const transcript = await getYoutubeTranscript(id);
      
      if (!transcript || transcript.length === 0) {
        // Better error handling for missing transcripts
        logger.warn('state', 'No transcript available, generating simplified course structure', { videoId: id });
        
        // Create a basic course structure even without transcript
        return {
          title: videoDetails.title,
          description: videoDetails.description || `A course about ${videoDetails.title}`,
          videoId: id,
          image: videoDetails.thumbnail,
          metadata: {
            title: videoDetails.title,
            description: videoDetails.description || `Learn about ${videoDetails.title}`,
            objectives: ['Understand the concepts presented in the video'],
            prerequisites: ['Basic understanding of the topic'],
            duration: videoDetails.duration || '30 minutes',
            category: 'General',
            difficulty: 'Intermediate',
            sources: [{
              title: videoDetails.title,
              url: `https://youtube.com/watch?v=${id}`,
              description: 'Original video source',
              type: 'video'
            }]
          },
          sections: [{
            id: 'section-1',
            title: 'Video Content',
            description: `Content from ${videoDetails.title}`,
            lessons: [{
              id: 'lesson-1-1',
              title: 'Main Concepts',
              description: `Learn about ${videoDetails.title}`,
              duration: videoDetails.duration || '30 minutes',
              keyPoints: ['Key concepts from the video'],
              resources: []
            }],
            duration: videoDetails.duration || '30 minutes'
          }],
          assessments: [{
            type: 'quiz',
            title: 'Knowledge Check',
            description: 'Test your understanding',
            placeholder: true
          }]
        };
      }
      
      // Process transcript to extract course structure
      const { sections, objectives, category, difficulty } = await processTranscript(
        transcript, 
        videoDetails.title
      );
      
      // Calculate total duration from transcript
      const totalDurationSeconds = transcript.reduce((sum, segment) => sum + segment.duration, 0);
      const totalDurationMinutes = Math.ceil(totalDurationSeconds / 60);
      const hours = Math.floor(totalDurationMinutes / 60);
      const minutes = totalDurationMinutes % 60;
      const formattedDuration = hours > 0 
        ? `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`
        : `${minutes} minute${minutes > 1 ? 's' : ''}`;
      
      // Prepare default prerequisites (would be AI-determined in production)
      const prerequisites = [
        'Basic understanding of the subject',
        'Access to a computer with internet connection'
      ];
      
      // Sample sources - in production, this would come from the fetchResources tool
      const defaultSources = [
        {
          title: 'YouTube Video',
          url: `https://youtube.com/watch?v=${id}`,
          description: 'Original video used for this course',
          type: 'video' as const
        }
      ];
      
      // Only add channel source if channel info is available
      if (videoDetails.channel && videoDetails.channel.id) {
        defaultSources.push({
          title: videoDetails.channel.name,
          url: `https://youtube.com/channel/${videoDetails.channel.id}`,
          description: 'Channel that created the original content',
          type: 'video' as const
        });
      }
      
      // Create course assessments (placeholders)
      const assessments = [
        {
          type: 'quiz' as const,
          title: 'Knowledge Check',
          description: 'Test your understanding of the course content',
          sectionId: sections[0]?.id,
          placeholder: true
        },
        {
          type: 'project' as const,
          title: 'Apply Your Knowledge',
          description: 'Create a project applying what you learned in this course',
          placeholder: true
        },
        {
          type: 'test' as const,
          title: 'Final Assessment',
          description: 'Comprehensive test covering all course material',
          placeholder: true
        }
      ];
      
      // Construct the final course object
      const course: CourseData = {
        title: videoDetails.title,
        description: videoDetails.description || `A comprehensive course on ${videoDetails.title}`,
        videoId: id,
        image: videoDetails.thumbnail,
        metadata: {
          title: videoDetails.title,
          description: videoDetails.description || `Learn about ${videoDetails.title} with this comprehensive course.`,
          objectives,
          prerequisites,
          duration: formattedDuration,
          category,
          difficulty,
          sources: defaultSources
        },
        sections,
        assessments
      };

      logger.info('state', 'Course generation completed', { 
        title: course.title,
        sections: course.sections.length 
      });

      return course;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('state', 'Course generation failed', { error: errorMessage });
      throw error;
    }
  }
});

// Additional tool for generating course content from a playlist
export const generateCourseFromPlaylist = tool({
  description: 'Generate a structured course from a YouTube playlist, combining multiple videos into a cohesive curriculum',
  parameters: z.object({
    playlistUrl: z.string().describe('YouTube playlist URL or ID'),
    complexity: z.enum(['simple', 'detailed']).optional().describe('Level of detail for course generation')
  }),
  execute: async ({ playlistUrl, complexity = 'detailed' }) => {
    try {
      logger.info('state', 'Starting course generation from playlist', {
        playlistUrl,
        complexity
      });

      // Extract playlist ID from URL if needed
      const { type, id } = await identifyYoutubeIdType(playlistUrl);
      
      if (!id || type !== 'playlist') {
        throw new Error('Invalid YouTube playlist URL or ID');
      }
      
      // Fetch playlist details
      const playlistDetails = await getPlaylistDetails(id);
      
      if (!playlistDetails.videos || playlistDetails.videos.length === 0) {
        throw new Error('Playlist has no videos');
      }
      
      // Use the first video for the course thumbnail if available
      const firstVideoId = playlistDetails.videos[0]?.id;
      
      // Generate sections based on videos in the playlist
      const sections: z.infer<typeof sectionSchema>[] = [];
      
      // Group videos into reasonable sections (maximum 5 videos per section)
      const maxVideosPerSection = 5;
      const sectionCount = Math.ceil(playlistDetails.videos.length / maxVideosPerSection);
      
      for (let i = 0; i < sectionCount; i++) {
        const startIndex = i * maxVideosPerSection;
        const endIndex = Math.min(startIndex + maxVideosPerSection, playlistDetails.videos.length);
        const sectionVideos = playlistDetails.videos.slice(startIndex, endIndex);
        
        const lessons: z.infer<typeof lessonSchema>[] = [];
        
        for (let j = 0; j < sectionVideos.length; j++) {
          const video = sectionVideos[j];
          lessons.push({
            id: `lesson-${i + 1}-${j + 1}`,
            title: video.title,
            description: video.description || `Learn about important concepts in ${video.title}`,
            duration: video.duration || '10 minutes', // Fallback duration
            keyPoints: ['Understanding key concepts', 'Practical application'],
            resources: [{
              title: video.title,
              url: `https://youtube.com/watch?v=${video.id}`,
              description: 'Original video for this lesson',
              type: 'video' as const
            }]
          });
        }
        
        sections.push({
          id: `section-${i + 1}`,
          title: `Section ${i + 1}: ${startIndex === 0 ? 'Introduction' : `Advanced Topics ${i}`}`,
          description: `Part ${i + 1} of the ${playlistDetails.title} course`,
          lessons,
          duration: '1-2 hours' // Estimated duration
        });
      }
      
      // Default course metadata
      const course: CourseData = {
        title: playlistDetails.title,
        description: playlistDetails.description || `A comprehensive course based on the playlist: ${playlistDetails.title}`,
        videoId: firstVideoId || '',
        image: playlistDetails.thumbnail,
        metadata: {
          title: playlistDetails.title,
          description: playlistDetails.description || `Learn with this comprehensive playlist course.`,
          objectives: [
            'Master all concepts covered in the playlist',
            'Gain practical skills through multiple video lessons',
            'Develop comprehensive understanding of the subject'
          ],
          prerequisites: ['Basic understanding of the subject'],
          duration: `${playlistDetails.videos.length} videos`,
          category: 'Programming', // Default category
          difficulty: 'Intermediate', // Default difficulty
          sources: [{
            title: 'YouTube Playlist',
            url: `https://youtube.com/playlist?list=${id}`,
            description: 'Original playlist used for this course',
            type: 'video' as const
          }]
        },
        sections,
        assessments: [
          {
            type: 'test' as const,
            title: 'Comprehensive Assessment',
            description: 'Test covering all videos in the playlist',
            placeholder: true
          }
        ]
      };

      logger.info('state', 'Playlist course generation completed', { 
        title: course.title,
        videos: playlistDetails.videos.length
      });

      return course;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('state', 'Playlist course generation failed', { error: errorMessage });
      throw error;
    }
  }
});
