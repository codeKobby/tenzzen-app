import { Course } from "@/types/course";

export const mockCourses: Record<string, Course> = {
  "react-fundamentals": {
    title: "React.js Fundamentals",
    subtitle: "Master the Basics of Modern React Development",
    overview: {
      description: "A comprehensive introduction to React.js, covering core concepts, hooks, and modern best practices.",
      prerequisites: [
        {
          title: "JavaScript Knowledge",
          description: "Familiarity with ES6+ JavaScript features",
          level: "intermediate"
        },
        {
          title: "Web Development Basics",
          description: "Understanding of HTML, CSS, and basic web concepts",
          level: "beginner"
        }
      ],
      learningOutcomes: [
        {
          title: "React Fundamentals",
          description: "Understand core React concepts like components, props, and state",
          category: "core"
        },
        {
          title: "Hooks System",
          description: "Master React hooks for state management and side effects",
          category: "advanced"
        }
      ],
      totalDuration: "2 hours 15 minutes",
      difficultyLevel: "intermediate",
      skills: ["React.js", "JavaScript", "Web Development", "Frontend"],
      tools: ["Node.js", "npm", "VS Code", "React DevTools"]
    },
    sections: [
      {
        title: "Introduction to React",
        description: "Understand the basics of React and its core principles",
        duration: "30 minutes",
        startTime: 0,
        endTime: 1800,
        lessons: [
          {
            title: "What is React?",
            duration: "15 minutes",
            description: "Learn about React's philosophy and virtual DOM",
            content: "Detailed explanation of React's core concepts",
            startTime: 0,
            endTime: 900,
            resources: [
              {
                title: "React Documentation",
                type: "documentation",
                url: "https://react.dev",
                description: "Official React documentation"
              }
            ]
          },
          {
            title: "Setting Up a React Project",
            duration: "15 minutes",
            description: "Create your first React application",
            content: "Step by step guide to create a new React project",
            startTime: 900,
            endTime: 1800,
            resources: []
          }
        ]
      },
      {
        title: "Components and Props",
        description: "Deep dive into React components",
        duration: "45 minutes",
        startTime: 1800,
        endTime: 4500,
        lessons: [
          {
            title: "Functional Components",
            duration: "25 minutes",
            description: "Learn to create and use functional components",
            content: "Detailed guide on writing functional components",
            startTime: 1800,
            endTime: 3300,
            resources: []
          },
          {
            title: "Working with Props",
            duration: "20 minutes",
            description: "Understanding component props",
            content: "Complete guide to React props",
            startTime: 3300,
            endTime: 4500,
            resources: []
          }
        ]
      }
    ]
  },
  "nextjs-advanced": {
    title: "Advanced Next.js Development",
    subtitle: "Building Production-Ready Applications with Next.js",
    overview: {
      description: "Master advanced Next.js concepts and patterns for building scalable applications",
      prerequisites: [
        {
          title: "React Knowledge",
          description: "Strong understanding of React and its ecosystem",
          level: "advanced"
        }
      ],
      learningOutcomes: [
        {
          title: "Server Components",
          description: "Master Next.js server components and streaming",
          category: "advanced"
        }
      ],
      totalDuration: "3 hours",
      difficultyLevel: "advanced",
      skills: ["Next.js", "React", "TypeScript", "Full-stack Development"],
      tools: ["Node.js", "TypeScript", "VS Code"]
    },
    sections: [
      {
        title: "Server Components",
        description: "Deep dive into React Server Components",
        duration: "60 minutes",
        startTime: 0,
        endTime: 3600,
        lessons: [
          {
            title: "Introduction to RSC",
            duration: "30 minutes",
            description: "Understanding React Server Components",
            content: "Comprehensive overview of server components",
            startTime: 0,
            endTime: 1800,
            resources: []
          },
          {
            title: "Building with Server Components",
            duration: "30 minutes",
            description: "Practical applications of server components",
            content: "Hands-on guide to implementing server components",
            startTime: 1800,
            endTime: 3600,
            resources: []
          }
        ]
      }
    ]
  }
};

export function getMockCourse(videoId: string): Course | null {
  // In a real application, you might want to deterministically
  // generate a course based on the videoId. For now, we'll
  // just return a random course from our mock data
  const courses = Object.values(mockCourses);
  const randomIndex = Math.floor(Math.random() * courses.length);
  return courses[randomIndex];
}