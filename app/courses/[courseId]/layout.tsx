import { Metadata } from "next"

export { generateCourseMetadata as generateMetadata } from "./metadata"

export default function CourseLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-[calc(100vh-64px)] flex-col">
            {children}
        </div>
    )
}
