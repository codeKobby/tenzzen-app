import type { Course, ResourceType } from "@/types/course"; // Import ResourceType
import { mockSources } from "./sources";

export const mockCourseData: Course = {
  title: "Introduction to Web Development: HTML, CSS & JavaScript",
  // subtitle: "...", // Removed subtitle
  description: "A comprehensive course covering the fundamentals of web development, from structuring content with HTML to styling with CSS and adding interactivity with JavaScript.",
  videoId: "W6NZfCO5SIk", // Default YouTube video ID
  // thumbnail: "/course-thumbnails/course-1.jpg", // Removed thumbnail
  // overview: { ... }, // Removed overview
  metadata: {
    title: "Introduction to Web Development: HTML, CSS & JavaScript", // Added title to metadata
    description: "A comprehensive course covering the fundamentals of web development, from structuring content with HTML to styling with CSS and adding interactivity with JavaScript.", // Added description
    difficulty: "Beginner",
    duration: "6 weeks",
    category: "Programming",
    // subcategory: "Web Development", // Removed subcategory as it's not in the type
    prerequisites: ["Basic computer skills", "Text editor installed"],
    objectives: [
      "Build and style web pages using HTML and CSS",
      "Create interactive elements with JavaScript",
      "Understand fundamental web development concepts",
      "Create a simple portfolio website from scratch"
    ],
    // targetAudience: [ // Removed targetAudience as it's not in the type
    //   "Aspiring web developers",
    //   "Designers looking to code their own designs",
    //   "Students interested in front-end development"
    // ],
    tags: ["Web Development", "HTML", "CSS", "JavaScript"], // Added missing tags array
    sources: mockSources.map(source => ({ // Map mockSources to Resource type
      title: source.name,
      url: source.url,
      type: source.type as ResourceType, // Assuming type matches ResourceType enum
      description: `Official website for ${source.name}` // Add placeholder description
    }))
  },
  sections: [
    {
      id: "section-1",
      title: "Getting Started with HTML",
      description: "Learn the basics of HTML and how to structure web content",
      startTime: 0, // Added missing fields
      endTime: 2100, // Added missing fields (example value)
      objective: "Understand HTML structure and basic elements", // Added missing fields
      keyPoints: ["HTML Structure", "Common Elements"], // Added missing fields
      lessons: [
        {
          id: "lesson-1-1",
          title: "Understanding HTML Document Structure",
          description: "Learn about the basic structure of HTML documents, including doctype declarations, head and body sections, and essential HTML tags.",
          // content: "...", // Removed content field
          keyPoints: [
            "DOCTYPE declarations and their purpose",
            "HTML, HEAD, and BODY tags",
            "Semantic structure of web documents",
            "Creating proper page titles and metadata"
          ],
          duration: "15m",
          startTime: 0, // Added missing fields
          endTime: 900, // Added missing fields (15 * 60)
          // resources: [ // resources not part of Lesson type
          //   {
          //     title: "HTML5 Documentation",
          //     url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
          //     type: "documentation"
          //   }
          // ]
        },
        {
          id: "lesson-1-2",
          title: "Working with HTML Elements",
          description: "Explore common HTML elements like headings, paragraphs, lists, and links to create structured content for web pages.",
          // content: "...", // Removed content field
          keyPoints: [
            "Using headings (h1-h6) for structure",
            "Writing paragraphs with <p>",
            "Creating unordered (ul) and ordered (ol) lists",
            "Understanding block vs inline elements (basic)"
          ],
          duration: "20m",
          startTime: 901, // Added missing fields
          endTime: 2100, // Added missing fields (900 + 20 * 60)
          // resources: [ // resources not part of Lesson type
          //   {
          //     title: "MDN HTML Elements Reference",
          //     url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element",
          //     type: "documentation"
          //   }
          // ]
        }
      ]
    }
    // Add subsequent sections here if needed...
  ],
  resources: [], // Added missing resources array
  assessments: [] // Added missing assessments array
};
