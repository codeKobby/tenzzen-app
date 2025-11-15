import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Course Details",
    description: "Learn at your own pace with our comprehensive course content"
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-[calc(100vh-64px)] flex-col">
            {children}
        </div>
    )
}
