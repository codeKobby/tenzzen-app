"use client"

import { useState } from "react"
import {
    Search,
    Compass,
    TrendingUp,
    Star,
    Users,
    Clock,
    BookOpen,
    Trophy,
    Target,
    ArrowRight,
    PlayCircle,
    Plus,
    Flame,
    Sparkles
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Course } from "../courses/types"
import { CourseDialog } from "../courses/components/course-dialog"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CourseGenerationModal } from "./components/course-generation-modal"
import Link from "next/link"
import Image from "next/image"

const categories = [
    { name: "Programming", count: 245, icon: BookOpen },
    { name: "Data Science", count: 189, icon: Target },
    { name: "Web Development", count: 312, icon: Compass },
    { name: "Mobile Development", count: 156, icon: Trophy }
]

const sampleCourses: Course[] = [
    {
        id: "1",
        title: "Advanced Machine Learning with Python",
        description: "Master machine learning concepts and implement real-world projects",
        instructor: "freeCodeCamp",
        category: "Programming",
        duration: "24h 30m",
        progress: 0,
        enrolledCount: 3456,
        rating: 4.9,
        totalLessons: 48,
        completedLessons: 0,
        thumbnail: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=60",
        videoSource: "freeCodeCamp.org"
    },
    {
        id: "2",
        title: "Full-Stack Web Development Bootcamp",
        description: "Complete guide to modern web development with React and Node.js",
        instructor: "Traversy Media",
        category: "Web Development",
        duration: "32h 15m",
        progress: 0,
        enrolledCount: 5678,
        rating: 4.8,
        totalLessons: 64,
        completedLessons: 0,
        thumbnail: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&auto=format&fit=crop&q=60",
        videoSource: "Traversy Media"
    },
    {
        id: "3",
        title: "UI/UX Design Masterclass",
        description: "Learn modern interface design principles and tools",
        instructor: "Design Course",
        category: "Design",
        duration: "18h 45m",
        progress: 0,
        enrolledCount: 2890,
        rating: 4.7,
        totalLessons: 36,
        completedLessons: 0,
        thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=60",
        videoSource: "Design Course"
    },
    {
        id: "4",
        title: "Data Science Fundamentals",
        description: "Comprehensive introduction to data analysis and visualization",
        instructor: "DataCamp",
        category: "Data Science",
        duration: "28h 20m",
        progress: 0,
        enrolledCount: 4123,
        rating: 4.6,
        totalLessons: 56,
        completedLessons: 0,
        thumbnail: "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800&auto=format&fit=crop&q=60",
        videoSource: "DataCamp"
    }
]

interface CourseSectionProps {
    title: string;
    icon: any;
    courses: Course[];
    onSelectCourse: (course: Course) => void;
}

const CourseSection = ({ title, icon: Icon, courses, onSelectCourse }: CourseSectionProps) => (
    <div>
        <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
                <Icon className="w-5 h-5 text-[var(--onBackground)]" />
                <h2 className="text-lg font-semibold text-[var(--onBackground)]">{title}</h2>
            </div>
            <Button 
                variant="ghost" 
                size="sm"
                className="text-sm text-[var(--onBackground)] opacity-80 hover:opacity-100"
            >
                View all
                <ArrowRight className="ml-1 w-4 h-4" />
            </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {courses.map((course) => (
                <div
                    key={course.id}
                    className="group bg-[var(--surface)] border border-[var(--border)] rounded-lg hover:shadow-[var(--shadow)] transition-all cursor-pointer overflow-hidden"
                    onClick={() => onSelectCourse(course)}
                >
                    <div className="aspect-video relative">
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]">
                            <BookOpen className="w-8 h-8 text-[var(--onBackground)] opacity-20" />
                        </div>
                        {course.thumbnail && (
                            <Image 
                                src={course.thumbnail}
                                alt={course.title}
                                fill
                                className="object-cover"
                            />
                        )}
                        <button 
                            className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/0 group-hover:bg-[var(--background)]/80 transition-all"
                            aria-label="Preview course"
                        >
                            <PlayCircle className="w-8 h-8 text-[var(--onBackground)] opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                        <div className="absolute top-2 left-2 px-2 py-1 bg-[var(--background)]/90 backdrop-blur-sm rounded-full">
                            <span className="text-xs font-medium text-[var(--onBackground)]">{course.videoSource}</span>
                        </div>
                    </div>
                    <div className="p-3 space-y-2">
                        <h3 className="font-medium text-sm line-clamp-2">{course.title}</h3>
                        <div className="flex items-center justify-between text-xs text-[var(--onBackground)] opacity-80">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {course.enrolledCount.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Star className="w-3 h-3 text-[var(--primary)]" />
                                    {course.rating}
                                </span>
                            </div>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {course.duration}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
)

export default function ExplorePage() {
    const { user } = useAuth()
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)

    const filteredCourses = sampleCourses.filter(course =>
        searchQuery.toLowerCase().trim() === "" ||
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="p-6 space-y-10 w-full">
            <div className="space-y-10">
                {/* Hero Section */}
                <div className="relative bg-[var(--primary)] text-[var(--onPrimary)] rounded-2xl p-8 md:p-12 overflow-hidden shadow-lg">
                    <div className="relative z-10 max-w-xl">
                        <h1 className="text-3xl md:text-4xl font-bold mb-4">
                            Create Your Own Learning Path
                        </h1>
                        <p className="opacity-90 mb-6">
                            Generate personalized courses from YouTube content or describe what you want to learn
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={() => user ? setShowGenerateModal(true) : setShowAuthPrompt(true)}
                                variant="secondary"
                                className="flex items-center gap-2 px-6 py-3 font-semibold shadow-md"
                            >
                                <Plus className="w-5 h-5" />
                                Generate Course
                            </Button>
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--onBackground)] opacity-60" />
                                <Input
                                    type="text"
                                    placeholder="Or search existing courses..."
                                    className="w-full pl-10 pr-4 py-3 bg-[var(--surface)] text-[var(--onBackground)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] shadow-md"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="absolute right-0 bottom-0 w-1/3 h-full bg-gradient-to-l from-[var(--primary)] to-transparent opacity-30" />
                </div>

                {/* Categories */}
                <div>
                    <h2 className="text-xl font-semibold text-[var(--onBackground)] mb-6">Browse Categories</h2>
                    <div className="flex flex-wrap gap-3">
                        {categories.map((category) => (
                            <Button
                                key={category.name}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] hover:shadow-[var(--shadow)] transition-all"
                                aria-label={`Browse ${category.name} courses`}
                            >
                                <div className="p-1 bg-[var(--primary)]/10 rounded">
                                    <category.icon className="w-4 h-4 text-[var(--primary)]" />
                                </div>
                                <span className="font-medium">{category.name}</span>
                                <span className="text-xs text-[var(--onBackground)] opacity-60">
                                    {category.count}
                                </span>
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Course Sections */}
                <div className="space-y-12">
                    <CourseSection
                        title="Recommended for You"
                        icon={Sparkles}
                        courses={filteredCourses.slice(0, 4)}
                        onSelectCourse={setSelectedCourse}
                    />
                    <CourseSection
                        title="Trending Courses"
                        icon={TrendingUp}
                        courses={filteredCourses.slice(0, 4)}
                        onSelectCourse={setSelectedCourse}
                    />
                    <CourseSection
                        title="Popular Courses"
                        icon={Flame}
                        courses={filteredCourses.slice(0, 4)}
                        onSelectCourse={setSelectedCourse}
                    />
                </div>
            </div>

            {/* Course Dialog */}
            <CourseDialog
                course={selectedCourse}
                open={!!selectedCourse}
                onOpenChange={(open) => !open && setSelectedCourse(null)}
            />

            {/* Course Generation Modal */}
            {showGenerateModal && (
                <CourseGenerationModal
                    isOpen={showGenerateModal}
                    onClose={() => setShowGenerateModal(false)}
                />
            )}

            {/* Auth Prompt Dialog */}
            <Dialog open={showAuthPrompt} onOpenChange={setShowAuthPrompt}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Sign in to Tenzzen</DialogTitle>
                        <DialogDescription>
                            Sign in to create and access more courses.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 mt-4">
                        <Button asChild>
                            <Link href="/signin">Sign In</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/signup">Create an Account</Link>
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
