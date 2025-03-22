import type { Course } from "@/types/course";

export const mockCourseData: Course = {
  title: "Introduction to Web Development: HTML, CSS & JavaScript",
  description: "A comprehensive course covering the fundamentals of web development, from structuring content with HTML to styling with CSS and adding interactivity with JavaScript.",
  videoId: "W6NZfCO5SIk", // Default YouTube video ID
  thumbnail: "/course-thumbnails/course-1.jpg", // Default thumbnail image
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
          keyPoints: [
            "DOCTYPE declarations and their purpose",
            "HTML, HEAD, and BODY tags",
            "Semantic structure of web documents",
            "Creating proper page titles and metadata"
          ],
          duration: 15, // in minutes
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
          keyPoints: [
            "Heading levels (h1-h6) and their proper usage",
            "Paragraph and text formatting tags",
            "Creating ordered and unordered lists",
            "Adding links with the anchor tag"
          ],
          duration: 20, // in minutes
          resources: [
            {
              title: "HTML Elements Reference",
              url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element",
              type: "reference"
            }
          ]
        }
      ]
    },
    {
      id: "section-2",
      title: "CSS Fundamentals",
      description: "Master the basics of CSS to style and layout your web pages",
      lessons: [
        {
          id: "lesson-2-1",
          title: "CSS Selectors and Properties",
          description: "Learn how to select HTML elements and apply various styling properties to change their appearance.",
          keyPoints: [
            "Different types of CSS selectors (element, class, ID)",
            "Common CSS properties for text, colors, and spacing",
            "The CSS box model explained",
            "CSS specificity and inheritance"
          ],
          duration: 25, // in minutes
          resources: [
            {
              title: "CSS Reference",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference",
              type: "reference"
            }
          ]
        },
        {
          id: "lesson-2-2",
          title: "CSS Layout Techniques",
          description: "Explore various ways to position and arrange elements on your web pages for responsive designs.",
          keyPoints: [
            "Using Flexbox for one-dimensional layouts",
            "CSS Grid for two-dimensional layouts",
            "Positioning elements (relative, absolute, fixed)",
            "Creating responsive designs with media queries"
          ],
          duration: 30, // in minutes
          resources: [
            {
              title: "Learn CSS Layout",
              url: "https://learnlayout.com/",
              type: "tutorial"
            }
          ]
        }
      ]
    },
    {
      id: "section-3",
      title: "JavaScript Essentials",
      description: "Learn the core concepts of JavaScript programming for interactive web applications",
      lessons: [
        {
          id: "lesson-3-1",
          title: "JavaScript Syntax and Data Types",
          description: "Understand the fundamental syntax and data structures in JavaScript.",
          keyPoints: [
            "Variables, constants, and data types",
            "Operators and expressions",
            "Arrays and objects",
            "Understanding scope and hoisting"
          ],
          duration: 35, // in minutes
          resources: [
            {
              title: "JavaScript Guide",
              url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
              type: "guide"
            }
          ]
        },
        {
          id: "lesson-3-2",
          title: "DOM Manipulation with JavaScript",
          description: "Learn how to interact with HTML elements using JavaScript to create dynamic web pages.",
          keyPoints: [
            "Selecting elements using querySelector and getElementById",
            "Changing element content and attributes",
            "Event handling (click, submit, load)",
            "Creating and removing HTML elements dynamically"
          ],
          duration: 40, // in minutes
          resources: [
            {
              title: "DOM API Reference",
              url: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model",
              type: "reference"
            }
          ]
        }
      ]
    }
  ],
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
    sources: [
      {
        name: "YouTube",
        type: "video",
        avatar: "https://www.youtube.com/favicon.ico",
        url: "https://youtube.com"
      },
      {
        name: "MDN Web Docs",
        type: "documentation",
        avatar: "https://developer.mozilla.org/favicon-48x48.png",
        url: "https://developer.mozilla.org"
      },
      {
        name: "W3Schools",
        type: "tutorial",
        avatar: "https://www.w3schools.com/favicon.ico",
        url: "https://www.w3schools.com"
      },
      {
        name: "CSS Tricks",
        type: "blog",
        avatar: "https://css-tricks.com/favicon.ico",
        url: "https://css-tricks.com"
      }
    ]
  }
};
