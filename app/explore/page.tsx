"use client"

import { useState } from "react"
import {
    Search,
    Compass,
    BookOpen,
    Trophy,
    Target,
    Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { CourseGenerationModal } from "./components/course-generation-modal"
import Link from "next/link"

const categories = [
    { name: "Programming", count: 245, icon: BookOpen },
    { name: "Data Science", count: 189, icon: Target },
    { name: "Web Development", count: 312, icon: Compass },
    { name: "Mobile Development", count: 156, icon: Trophy }
]

export default function ExplorePage() {
    const { user } = useAuth()
    const [searchQuery, setSearchQuery] = useState("")
    const [showGenerateModal, setShowGenerateModal] = useState(false)
    const [showAuthPrompt, setShowAuthPrompt] = useState(false)

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="relative bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 overflow-hidden shadow-lg">
                <div className="relative z-10 max-w-xl">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        Create Your Own Learning Path
                    </h1>
                    <p className="text-primary-foreground/90 mb-6">
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
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/60" />
                            <Input
                                type="text"
                                placeholder="Or search existing courses..."
                                className="w-full pl-10 pr-4 py-3 bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary shadow-md"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 bottom-0 w-1/3 h-full bg-gradient-to-l from-primary to-transparent opacity-30" />
            </div>

            {/* Categories */}
            <div>
                <h2 className="text-xl font-semibold mb-6">Browse Categories</h2>
                <div className="flex flex-wrap gap-3">
                    {categories.map((category) => (
                        <Button
                            key={category.name}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 bg-card hover:shadow transition-all"
                            aria-label={`Browse ${category.name} courses`}
                        >
                            <div className="p-1 bg-primary/10 rounded">
                                <category.icon className="w-4 h-4 text-primary" />
                            </div>
                            <span className="font-medium">{category.name}</span>
                            <span className="text-xs text-muted-foreground">
                                {category.count}
                            </span>
                        </Button>
                    ))}
                </div>
            </div>

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
