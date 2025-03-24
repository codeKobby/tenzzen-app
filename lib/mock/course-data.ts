import type { Course } from "@/types/course";
import { mockSources } from "./sources";

export const mockCourseData: Course = {
  title: "Introduction to Web Development: HTML, CSS & JavaScript",
  subtitle: "A comprehensive introduction to front-end web technologies",
  description: "A comprehensive course covering the fundamentals of web development, from structuring content with HTML to styling with CSS and adding interactivity with JavaScript.",
  videoId: "W6NZfCO5SIk", // Default YouTube video ID
  thumbnail: "/course-thumbnails/course-1.jpg", // Default thumbnail image
  overview: {
    description: "This course provides a thorough introduction to the core technologies of web development. You'll learn how to structure content with HTML, style it with CSS, and add interactivity with JavaScript. By the end, you'll be able to build responsive websites from scratch.",
    prerequisites: ["Basic computer skills", "Text editor installed", "Interest in web development"],
    learningOutcomes: [
      "Build and style web pages using HTML and CSS",
      "Create interactive elements with JavaScript",
      "Understand fundamental web development concepts",
      "Create a simple portfolio website from scratch"
    ],
    totalDuration: "6 weeks",
    difficultyLevel: "Beginner",
    skills: ["HTML", "CSS", "JavaScript", "Responsive Design", "Web Development"],
    tools: ["VS Code", "Chrome DevTools", "GitHub"]
  },
  metadata: {
    difficulty: "Beginner",
    duration: "6 weeks",
    category: "Programming",
    subcategory: "Web Development",
    prerequisites: ["Basic computer skills", "Text editor installed"],
    objectives: [
      "Build and style web pages using HTML and CSS",
      "Create interactive elements with JavaScript",
      "Understand fundamental web development concepts",
      "Create a simple portfolio website from scratch"
    ],
    targetAudience: [
      "Aspiring web developers",
      "Designers looking to code their own designs",
      "Students interested in front-end development"
    ],
    sources: mockSources
  },
  sections: [
    {
      id: "section-1",
      title: "Getting Started with HTML",
      description: "Learn the basics of HTML and how to structure web content",
      lessons: [
        {
          id: "lesson-1-1",
          title: "Understanding HTML Document Structure",
          description: "Learn about the basic structure of HTML documents, including doctype declarations, head and body sections, and essential HTML tags.",
          content: "# HTML Document Structure\n\nIn this lesson, we'll explore the fundamental structure of HTML documents. HTML (HyperText Markup Language) is the standard markup language for creating web pages.\n\n## Document Type Declaration\nEvery HTML document begins with a doctype declaration. For HTML5, this is simply:\n```html\n<!DOCTYPE html>\n```\n\n## The HTML Element\nAfter the doctype, we have the `<html>` element which is the root element of an HTML page:\n```html\n<html lang=\"en\">\n  <!-- content goes here -->\n</html>\n```\n\n## Head and Body Sections\nHTML documents are divided into two main sections:\n\n1. **Head Section**: Contains meta-information about the document\n```html\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Page Title</title>\n</head>\n```\n\n2. **Body Section**: Contains the actual content of the page\n```html\n<body>\n  <h1>Welcome to my website</h1>\n  <p>This is a paragraph of text.</p>\n</body>\n```\n\n## Putting It All Together\nHere's a complete basic HTML document:\n```html\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>My First HTML Page</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>Welcome to my first HTML page.</p>\n</body>\n</html>\n```",
          keyPoints: [
            "DOCTYPE declarations and their purpose",
            "HTML, HEAD, and BODY tags",
            "Semantic structure of web documents",
            "Creating proper page titles and metadata"
          ],
          duration: "15m",
          resources: [
            {
              title: "HTML5 Documentation",
              url: "https://developer.mozilla.org/en-US/docs/Web/HTML",
              type: "documentation"
            }
          ]
        },
        {
          id: "lesson-1-2",
          title: "Working with HTML Elements",
          description: "Explore common HTML elements like headings, paragraphs, lists, and links to create structured content for web pages.",
          content: "# Working with HTML Elements\n\nHTML provides various elements to structure and format content. In this lesson, we'll learn about the most commonly used HTML elements.\n\n## Headings\nHTML offers six levels of headings, from `<h1>` (most important) to `<h6>` (least important).\n\n```html\n<h1>Main Heading</h1>\n<h2>Subheading</h2>\n<h3>Section heading</h3>\n```\n\n## Paragraphs\nText content is typically placed within paragraph tags:\n\n```html\n<p>This is a paragraph of text. It can contain multiple sentences and will automatically wrap based on the width of its container.</p>\n```\n\n## Lists\nHTML offers two main types of lists:\n\n1. **Unordered Lists** - for items with no particular order:\n```html\n<ul>\n  <li>Item one</li>\n  <li>Item two</li>\n  <li>Item three</li>\n</ul>\n```\n\n2. **Ordered Lists** - for sequential items:\n```html\n<ol>\n  <li>First step</li>\n  <li>Second step</li>\n  <li>Third step</li>\n</ol>\n```\n
