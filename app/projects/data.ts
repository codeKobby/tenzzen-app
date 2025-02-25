import { Project } from "./types"

export const sampleProjects: Project[] = [
  {
    id: "1",
    title: "E-commerce Website",
    description: "Build a full-stack e-commerce website with Next.js, React, and Tailwind CSS. Implement product listings, shopping cart, user authentication, and payment processing.",
    status: "In Progress",
    courses: [
      { id: "101", title: "Full-Stack Web Development", slug: "full-stack-web-development" },
      { id: "102", title: "React Advanced Patterns", slug: "react-advanced-patterns" }
    ],
    dueDate: "2025-03-15T23:59:59Z",
    createdAt: "2025-02-20T12:00:00Z",
    thumbnail: "https://images.unsplash.com/photo-1607082350899-7e105aa886ae?w=800&auto=format&fit=crop&q=60",
    submissionType: "both",
    difficulty: "Intermediate"
  },
  {
    id: "2",
    title: "Machine Learning Image Classifier",
    description: "Develop a machine learning model for image classification using Python and TensorFlow. Create a web interface to upload and classify images.",
    status: "Not Started",
    courses: [
      { id: "201", title: "Advanced Machine Learning", slug: "advanced-machine-learning" }
    ],
    dueDate: "2025-03-22T23:59:59Z",
    createdAt: "2025-02-22T09:00:00Z",
    thumbnail: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?w=800&auto=format&fit=crop&q=60",
    submissionType: "file",
    difficulty: "Advanced"
  },
  {
    id: "3",
    title: "Mobile App UI Design",
    description: "Design a user interface for a mobile fitness application using Figma. Create wireframes, high-fidelity mockups, and a prototype for user testing.",
    status: "Submitted",
    submissionDate: "2025-02-18T14:30:00Z",
    courses: [
      { id: "301", title: "UI/UX Design Fundamentals", slug: "ui-ux-design-fundamentals" }
    ],
    createdAt: "2025-02-10T10:15:00Z",
    thumbnail: "https://images.unsplash.com/photo-1622542796254-5b9c46a259b8?w=800&auto=format&fit=crop&q=60",
    submissionType: "both",
    difficulty: "Beginner"
  },
  {
    id: "4",
    title: "RESTful API Development",
    description: "Build a RESTful API with Node.js, Express, and MongoDB. Implement CRUD operations, authentication, and authorization. Include documentation using Swagger.",
    status: "Graded",
    courses: [
      { id: "101", title: "Full-Stack Web Development", slug: "full-stack-web-development" }
    ],
    submissionDate: "2025-02-05T16:45:00Z",
    createdAt: "2025-01-20T11:30:00Z",
    feedback: {
      id: "f1",
      content: "Excellent implementation of the API endpoints. Good error handling and validation. Consider adding more comprehensive tests for edge cases.",
      grade: 85,
      createdAt: "2025-02-08T09:20:00Z"
    },
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=60",
    submissionType: "link",
    difficulty: "Intermediate"
  },
  {
    id: "5",
    title: "Data Visualization Dashboard",
    description: "Create an interactive data visualization dashboard using D3.js. Implement various chart types and allow users to filter and explore the data.",
    status: "Not Started",
    courses: [
      { id: "401", title: "Data Visualization", slug: "data-visualization" },
      { id: "402", title: "JavaScript for Data Science", slug: "javascript-for-data-science" }
    ],
    dueDate: "2025-03-25T23:59:59Z",
    createdAt: "2025-02-24T08:00:00Z",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
    submissionType: "both",
    difficulty: "Advanced"
  },
  {
    id: "6",
    title: "Responsive Portfolio Website",
    description: "Design and develop a responsive portfolio website using HTML, CSS, and JavaScript. Include sections for about, projects, skills, and contact.",
    status: "Graded",
    courses: [
      { id: "501", title: "Web Development Fundamentals", slug: "web-development-fundamentals" }
    ],
    submissionDate: "2025-02-12T10:30:00Z",
    createdAt: "2025-01-25T14:00:00Z",
    feedback: {
      id: "f2",
      content: "Great responsive design and clean code structure. The portfolio showcases your work effectively. Consider adding more interactive elements and animations.",
      grade: 92,
      createdAt: "2025-02-15T11:10:00Z"
    },
    thumbnail: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&auto=format&fit=crop&q=60",
    submissionType: "both",
    difficulty: "Beginner"
  },
  {
    id: "7",
    title: "Blockchain Smart Contract",
    description: "Create a smart contract using Solidity for a decentralized application. Implement token creation, ownership, and transfer functionality.",
    status: "In Progress",
    courses: [
      { id: "601", title: "Blockchain Development", slug: "blockchain-development" }
    ],
    dueDate: "2025-03-18T23:59:59Z",
    createdAt: "2025-02-18T16:30:00Z",
    thumbnail: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=800&auto=format&fit=crop&q=60",
    submissionType: "link",
    difficulty: "Advanced"
  },
  {
    id: "8",
    title: "Mobile Game Development",
    description: "Develop a simple mobile game using Unity and C#. Implement game mechanics, scoring system, and user interface.",
    status: "Not Started",
    courses: [
      { id: "701", title: "Game Development Fundamentals", slug: "game-development-fundamentals" }
    ],
    dueDate: "2025-03-30T23:59:59Z",
    createdAt: "2025-02-25T09:45:00Z",
    thumbnail: "https://images.unsplash.com/photo-1605899435973-ca2d1a8861cf?w=800&auto=format&fit=crop&q=60",
    submissionType: "file",
    difficulty: "Intermediate"
  }
]