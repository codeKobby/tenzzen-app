import type { Course } from "@/types/course";

export const mockCourseData: Course = {
  title: "Introduction to Web Development: HTML, CSS & JavaScript",
  description: "A comprehensive course covering the fundamentals of web development, from structuring content with HTML to styling with CSS and adding interactivity with JavaScript.",
  sections: [
    {
      title: "Getting Started with HTML",
      description: "Learn the basics of HTML and how to structure web content",
      lessons: [
        {
          title: "Understanding HTML Document Structure",
          description: "Learn about the basic structure of HTML documents, including doctype declarations, head and body sections, and essential HTML tags.",
          keyPoints: [
            "DOCTYPE declarations and their purpose",
            "HTML, HEAD, and BODY tags",
            "Semantic structure of web documents",
            "Creating proper page titles and metadata"
          ],
          resources: [
            {
              title: "HTML5 Documentation",
              url: "https://developer.mozilla.org/en-US/docs/Web/HTML"
            }
          ]
        },
        {
          title: "Working with HTML Elements",
          description: "Explore common HTML elements like headings, paragraphs, lists, and links to create structured content for web pages.",
          keyPoints: [
            "Heading levels (h1-h6) and their proper usage",
            "Paragraph and text formatting tags",
            "Creating ordered and unordered lists",
            "Adding links with the anchor tag"
          ],
          resources: [
            {
              title: "HTML Elements Reference",
              url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element"
            }
          ]
        }
      ]
    },
    {
      title: "CSS Fundamentals",
      description: "Master the basics of CSS to style and layout your web pages",
      lessons: [
        {
          title: "CSS Selectors and Properties",
          description: "Learn how to select HTML elements and apply various styling properties to change their appearance.",
          keyPoints: [
            "Different types of CSS selectors (element, class, ID)",
            "Common CSS properties for text, colors, and spacing",
            "The CSS box model explained",
            "CSS specificity and inheritance"
          ],
          resources: [
            {
              title: "CSS Reference",
              url: "https://developer.mozilla.org/en-US/docs/Web/CSS/Reference"
            }
          ]
        },
        {
          title: "CSS Layout Techniques",
          description: "Explore various ways to position and arrange elements on your web pages for responsive designs.",
          keyPoints: [
            "Using Flexbox for one-dimensional layouts",
            "CSS Grid for two-dimensional layouts",
            "Positioning elements (relative, absolute, fixed)",
            "Creating responsive designs with media queries"
          ],
          resources: [
            {
              title: "Learn CSS Layout",
              url: "https://learnlayout.com/"
            }
          ]
        }
      ]
    },
    {
      title: "JavaScript Essentials",
      description: "Learn the core concepts of JavaScript programming for interactive web applications",
      lessons: [
        {
          title: "JavaScript Syntax and Data Types",
          description: "Understand the fundamental syntax and data structures in JavaScript.",
          keyPoints: [
            "Variables, constants, and data types",
            "Operators and expressions",
            "Arrays and objects",
            "Understanding scope and hoisting"
          ],
          resources: [
            {
              title: "JavaScript Guide",
              url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide"
            }
          ]
        },
        {
          title: "DOM Manipulation with JavaScript",
          description: "Learn how to interact with HTML elements using JavaScript to create dynamic web pages.",
          keyPoints: [
            "Selecting elements using querySelector and getElementById",
            "Changing element content and attributes",
            "Event handling (click, submit, load)",
            "Creating and removing HTML elements dynamically"
          ],
          resources: [
            {
              title: "DOM API Reference",
              url: "https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model"
            }
          ]
        }
      ]
    }
  ],
  metadata: {
    difficulty: "Beginner",
    duration: "6 weeks",
    prerequisites: ["Basic computer skills", "Text editor installed"],
    objectives: [
      "Build and style web pages using HTML and CSS",
      "Create interactive elements with JavaScript",
      "Understand fundamental web development concepts",
      "Create a simple portfolio website from scratch"
    ]
  }
};
