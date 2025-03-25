import { logger } from '@/lib/ai/debug-logger';
import { tool } from 'ai';
import { z } from 'zod';
import { getYoutubeTranscript } from '@/actions/getYoutubeTranscript';
import { getVideoDetails } from '@/actions/getYoutubeData';
import { identifyYoutubeIdType } from '@/lib/utils/youtube';

// Schema for resource extraction
const resourceSchema = z.object({
  title: z.string().describe('Title of the resource'),
  url: z.string().url().describe('URL of the resource'),
  description: z.string().describe('Description of what the resource offers'),
  type: z.enum(['documentation', 'tutorial', 'article', 'video', 'code', 'blog']).describe('Type of resource')
});

export type Resource = z.infer<typeof resourceSchema>;

/**
 * Extract resources from text content (transcript, description)
 */
function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Parse URL to determine likely resource type
 */
function determineResourceType(url: string): 'documentation' | 'tutorial' | 'article' | 'video' | 'code' | 'blog' {
  if (!url) return 'article';
  
  const lowercaseUrl = url.toLowerCase();
  
  if (
    lowercaseUrl.includes('github.com') || 
    lowercaseUrl.includes('gist.github.com') || 
    lowercaseUrl.includes('codepen.io') || 
    lowercaseUrl.includes('jsfiddle.net')
  ) {
    return 'code';
  }
  
  if (
    lowercaseUrl.includes('youtube.com') || 
    lowercaseUrl.includes('youtu.be') || 
    lowercaseUrl.includes('vimeo.com')
  ) {
    return 'video';
  }
  
  if (
    lowercaseUrl.includes('docs.') || 
    lowercaseUrl.includes('documentation') || 
    lowercaseUrl.includes('reference') || 
    lowercaseUrl.includes('mozilla.org') || 
    lowercaseUrl.includes('w3.org') ||
    lowercaseUrl.includes('developer.')
  ) {
    return 'documentation';
  }
  
  if (
    lowercaseUrl.includes('tutorial') || 
    lowercaseUrl.includes('guide') || 
    lowercaseUrl.includes('how-to') || 
    lowercaseUrl.includes('learn')
  ) {
    return 'tutorial';
  }
  
  if (
    lowercaseUrl.includes('blog') || 
    lowercaseUrl.includes('medium.com')
  ) {
    return 'blog';
  }
  
  return 'article';
}

/**
 * Generate a reasonable title from URL if needed
 */
function generateTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Get the path without extension
    const path = urlObj.pathname
      .split('/')
      .filter(Boolean)
      .pop()
      ?.split('.')[0] || '';
    
    // Clean up the path by replacing hyphens with spaces and capitalizing words
    return path
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || urlObj.hostname;
  } catch (e) {
    // Return a portion of the URL if parsing fails
    return url.substring(0, 30) + '...';
  }
}

export const fetchResourcesFromVideo = tool({
  description: 'Fetch learning resources related to a YouTube video by analyzing its transcript and description',
  parameters: z.object({
    videoUrl: z.string().describe('YouTube video URL or ID'),
    maxResults: z.number().default(10).optional().describe('Maximum number of resources to fetch')
  }),
  execute: async ({ videoUrl, maxResults = 10 }) => {
    try {
      logger.info('state', 'Starting resource fetch', { videoUrl, maxResults });

      // Extract video ID from URL if needed
      const { type, id } = await identifyYoutubeIdType(videoUrl);
      
      if (!id) {
        throw new Error('Invalid YouTube video URL or ID');
      }
      
      // Fetch video details
      const videoDetails = await getVideoDetails(id);
      
      // Fetch video transcript
      const transcript = await getYoutubeTranscript(id);
      
      // Extract text from transcript
      const transcriptText = transcript.map(segment => segment.text).join(' ');
      
      // Extract all URLs from description and transcript
      const descriptionUrls = extractUrlsFromText(videoDetails.description || '');
      const transcriptUrls = extractUrlsFromText(transcriptText);
      
      // Combine all unique URLs
      const allUrls = Array.from(new Set([...descriptionUrls, ...transcriptUrls]));
      
      // Filter out YouTube and social media links
      const filteredUrls = allUrls.filter(url => {
        const lowercaseUrl = url.toLowerCase();
        return !(
          lowercaseUrl.includes('youtube.com/watch') || 
          lowercaseUrl.includes('youtu.be') || 
          lowercaseUrl.includes('twitter.com') || 
          lowercaseUrl.includes('facebook.com') ||
          lowercaseUrl.includes('instagram.com')
        );
      });
      
      // Process each URL to create a resource object
      const resources: Resource[] = filteredUrls.slice(0, maxResults).map(url => {
        // Generate title from URL if needed
        const title = generateTitleFromUrl(url);
        
        // Determine resource type
        const type = determineResourceType(url);
        
        return {
          title,
          url,
          description: `Resource related to ${videoDetails.title}`,
          type
        };
      });
      
      // Add original video as a resource
      resources.unshift({
        title: videoDetails.title,
        url: `https://youtube.com/watch?v=${id}`,
        description: 'Original video source',
        type: 'video'
      });
      
      // Add channel as a resource if available - with proper property names
      if (videoDetails.channelId && videoDetails.channelName) {
        resources.push({
          title: `${videoDetails.channelName} YouTube Channel`,
          url: `https://youtube.com/channel/${videoDetails.channelId}`,
          description: 'Channel that produced this content',
          type: 'video'
        });
      }
      
      logger.info('state', 'Resources extraction completed', { 
        resourceCount: resources.length 
      });

      // Return just the resources array without wrapping in an object
      return resources;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('state', 'Resource extraction failed', { error: errorMessage });
      throw error;
    }
  }
});

// Tool to get additional curated resources for a topic
export const fetchCuratedResources = tool({
  description: 'Fetch curated learning resources for a specific topic or subject',
  parameters: z.object({
    topic: z.string().describe('Topic to find resources for'),
    category: z.string().optional().describe('Category to filter resources by'),
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().describe('Difficulty level of resources'),
    maxResults: z.number().default(5).optional().describe('Maximum number of resources to fetch')
  }),
  execute: async ({ topic, category, difficulty, maxResults = 5 }) => {
    try {
      logger.info('state', 'Starting curated resources fetch', { topic, category, difficulty, maxResults });

      // In a production environment, this would query an API or database of curated resources
      // For now, we'll return mock data based on the topic
      
      // Some well-known resources for common topics
      const commonResources: Record<string, Resource[]> = {
        'javascript': [
          {
            title: 'MDN JavaScript Guide',
            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
            description: 'Comprehensive guide to JavaScript for both beginners and experienced developers',
            type: 'documentation'
          },
          {
            title: 'JavaScript.info',
            url: 'https://javascript.info/',
            description: 'Modern JavaScript tutorial with concepts and examples',
            type: 'tutorial'
          },
          {
            title: 'Eloquent JavaScript',
            url: 'https://eloquentjavascript.net/',
            description: 'Book about JavaScript, programming, and digital culture',
            type: 'article'
          }
        ],
        'python': [
          {
            title: 'Python Official Documentation',
            url: 'https://docs.python.org/3/',
            description: 'Official Python documentation with tutorials and module references',
            type: 'documentation'
          },
          {
            title: 'Real Python',
            url: 'https://realpython.com/',
            description: 'Python tutorials for developers of all skill levels',
            type: 'tutorial'
          }
        ],
        'css': [
          {
            title: 'CSS Tricks',
            url: 'https://css-tricks.com/',
            description: 'Tips, tricks, and techniques on using CSS',
            type: 'blog'
          },
          {
            title: 'MDN CSS Documentation',
            url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',
            description: 'Complete CSS reference and guides from MDN',
            type: 'documentation'
          }
        ],
        'react': [
          {
            title: 'React Official Documentation',
            url: 'https://reactjs.org/docs/getting-started.html',
            description: 'Official React documentation with guides and API reference',
            type: 'documentation'
          },
          {
            title: 'Overreacted by Dan Abramov',
            url: 'https://overreacted.io/',
            description: 'Personal blog by Dan Abramov, React team member',
            type: 'blog'
          }
        ]
      };
      
      // Try to find matching resources
      const lowerTopic = topic.toLowerCase();
      let matchedResources: Resource[] = [];
      
      // Look for exact matches first
      Object.keys(commonResources).forEach(key => {
        if (lowerTopic.includes(key)) {
          matchedResources = [...matchedResources, ...commonResources[key]];
        }
      });
      
      // Filter by difficulty if specified
      if (difficulty && matchedResources.length > 0) {
        // For this mock implementation, we'll just limit the results based on difficulty
        // In a real implementation, we'd have proper difficulty tags on resources
        if (difficulty === 'Beginner') {
          matchedResources = matchedResources.slice(0, Math.min(3, matchedResources.length));
        } else if (difficulty === 'Advanced') {
          matchedResources = matchedResources.slice(Math.max(1, matchedResources.length - 3));
        }
      }
      
      // Generate generic resources if no matches found
      if (matchedResources.length === 0) {
        matchedResources = [
          {
            title: `${topic} - Wikipedia`,
            url: `https://en.wikipedia.org/wiki/${topic.replace(/ /g, '_')}`,
            description: `Wikipedia article about ${topic}`,
            type: 'article'
          },
          {
            title: `Learn ${topic} - Online Tutorials`,
            url: `https://www.google.com/search?q=${encodeURIComponent(`${topic} tutorial`)}`,
            description: `Search for ${topic} tutorials online`,
            type: 'tutorial'
          }
        ];
      }
      
      // Limit results
      matchedResources = matchedResources.slice(0, maxResults);
      
      logger.info('state', 'Curated resources fetch completed', { 
        resourceCount: matchedResources.length 
      });

      // Return just the resources array without wrapping in an object
      return matchedResources;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('state', 'Curated resources fetch failed', { error: errorMessage });
      throw error;
    }
  }
});