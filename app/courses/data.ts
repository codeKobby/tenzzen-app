import { Course } from "./types"

export const sampleCourses: Course[] = [
  {
    id: "1",
    title: "Advanced JavaScript: From Fundamentals to Full Stack Development",
    description: "Master modern JavaScript with practical projects and real-world applications",
    duration: "24h 30m",
    progress: 65,
    category: "Programming",
    lastAccessed: "2 days ago",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
    isPublic: true,
    sources: [
      {
        name: "Frontend Masters",
        avatar: "https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&h=400&fit=crop"
      },
      {
        name: "Course Creator",
        avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop"
      }
    ],
    topics: {
      current: 31,
      total: 48,
      currentTitle: "Building Full Stack Applications"
    },
    rating: 4.8,
    enrolledCount: 12453
  },
  {
    id: "2",
    title: "UI/UX Design: Creating User-Centered Experiences",
    description: "Learn to design beautiful and functional user interfaces",
    duration: "18h 15m",
    progress: 25,
    category: "Design",
    lastAccessed: "1 week ago",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60",
    isPublic: true,
    sources: [
      {
        name: "Udemy",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop"
      },
      {
        name: "Design Expert",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop"
      }
    ],
    topics: {
      current: 9,
      total: 36,
      currentTitle: "User Research and Personas"
    },
    rating: 4.5,
    enrolledCount: 8756
  },
  {
    id: "3",
    title: "My Python Learning Path",
    description: "Custom curated Python tutorials and resources",
    duration: "32h 45m",
    progress: 0,
    category: "Programming",
    thumbnail: "https://images.unsplash.com/photo-1527430253228-e93688616381?w=800&auto=format&fit=crop&q=60",
    isPublic: false,
    sources: [
      {
        name: "Personal Collection",
        avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop"
      },
      {
        name: "Python.org",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"
      },
      {
        name: "Real Python",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop"
      }
    ],
    topics: {
      current: 0,
      total: 56,
      currentTitle: "Introduction to Python Basics"
    }
  },
  {
    id: "4",
    title: "Digital Marketing Mastery",
    description: "Comprehensive guide to modern digital marketing strategies",
    duration: "16h 20m",
    progress: 100,
    category: "Business",
    lastAccessed: "1 month ago",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
    isPublic: true,
    sources: [
      {
        name: "LinkedIn Learning",
        avatar: "https://images.unsplash.com/photo-1619946794135-5bc917a27793?w=400&h=400&fit=crop"
      }
    ],
    topics: {
      current: 32,
      total: 32,
      currentTitle: "Course Completed"
    },
    rating: 4.7,
    enrolledCount: 6234
  },
  {
    id: "5",
    title: "React Native Development Notes",
    description: "Personal collection of React Native tutorials",
    duration: "28h 45m",
    progress: 45,
    category: "Programming",
    lastAccessed: "3 days ago",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60",
    isPublic: false,
    sources: [
      {
        name: "React Native Docs",
        avatar: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop"
      },
      {
        name: "Community Tutorials",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop"
      }
    ],
    topics: {
      current: 23,
      total: 52,
      currentTitle: "Building Custom Components"
    }
  },
  {
    id: "6",
    title: "Data Visualization and Analytics",
    description: "Learn to create impactful data visualizations",
    duration: "20h 15m",
    progress: 15,
    category: "Design",
    lastAccessed: "5 days ago",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
    isPublic: true,
    sources: [
      {
        name: "DataCamp",
        avatar: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=400&h=400&fit=crop"
      },
      {
        name: "D3.js Community",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop"
      }
    ],
    topics: {
      current: 6,
      total: 40,
      currentTitle: "Principles of Data Visualization"
    },
    rating: 4.8,
    enrolledCount: 7345
  }
]
