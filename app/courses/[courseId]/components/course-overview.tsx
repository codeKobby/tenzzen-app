"use client"

import { CheckCircle, Code, Layers, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { NormalizedCourse } from "@/hooks/use-normalized-course"

interface CourseOverviewProps {
    course: NormalizedCourse
}

export function CourseOverview({ course }: CourseOverviewProps) {
    const prerequisites = course.metadata?.prerequisites || [
        "Basic understanding of the subject",
        "Interest in learning new concepts",
        "A computer with internet access"
    ]

    const objectives = course.metadata?.objectives || [
        "Understand core concepts of the subject",
        "Apply knowledge to practical scenarios",
        "Develop problem-solving skills",
        "Complete hands-on projects",
        "Build a foundation for advanced learning"
    ]

    const targetAudience = course.metadata?.targetAudience || [
        "Beginners interested in the subject",
        "Students looking to expand their knowledge",
        "Professionals seeking to update their skills",
        "Anyone curious about the topic"
    ]

    return (
        <div className="space-y-8">
            {/* Course Description */}
            <section>
                <h3 className="text-xl font-semibold mb-3">About This Course</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                    {course.description ||
                        `This comprehensive course is designed to take you from the fundamentals to advanced concepts in web development.

            You'll learn how to create modern, responsive websites using the latest technologies and best practices. Through hands-on projects and practical examples, you'll gain the skills needed to build professional web applications.`}
                </p>
            </section>

            {/* What You'll Learn */}
            <section>
                <h3 className="text-xl font-semibold mb-3">What You'll Learn</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {objectives.map((item: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 mt-0.5 text-green-600 dark:text-green-500 shrink-0" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Prerequisites & Target Audience Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Prerequisites */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Code className="h-5 w-5 text-primary" />
                            Prerequisites
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            {prerequisites.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Target Audience */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            Who This Course is For
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            {targetAudience.map((item: string, i: number) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Career Outcomes */}
            <section>
                <h3 className="text-xl font-semibold mb-3">Career Outcomes</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: "Front-End Developer", description: "Build user interfaces and interactive web experiences" },
                        { title: "Web Designer", description: "Create visually appealing and functional websites" },
                        { title: "UI Developer", description: "Implement responsive and accessible user interfaces" },
                        { title: "Freelance Developer", description: "Work independently on web development projects" }
                    ].map((career, i) => (
                        <Card key={i}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                    <Briefcase className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">{career.title}</h4>
                                        <p className="text-xs text-muted-foreground mt-1">{career.description}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>
        </div>
    )
}
