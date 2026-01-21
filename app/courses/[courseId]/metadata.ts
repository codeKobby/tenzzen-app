import { Metadata } from "next";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { fetchQuery } from "convex/nextjs";

export async function generateCourseMetadata({
  params,
}: {
  params: { courseId: string };
}): Promise<Metadata> {
  const { courseId } = params;

  try {
    // Fetch course data server-side
    const course = await fetchQuery(api.courses.getCourseWithContent, {
      courseId: courseId as Id<"courses">,
    });

    if (!course) {
      return {
        title: "Course Not Found",
        description: "The requested course could not be found.",
      };
    }

    const title = `${course.title} | Tenzzen AI`;
    const description =
      course.description ||
      "Master this topic with an AI-curated learning path on Tenzzen.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "article",
        url: `https://tenzzen.app/courses/${courseId}`,
        images: [
          {
            url: course.thumbnail || "https://tenzzen.app/og-image.png",
            width: 1200,
            height: 630,
            alt: course.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [course.thumbnail || "https://tenzzen.app/og-image.png"],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Tenzzen Course",
      description: "Learn anything with AI-powered courses.",
    };
  }
}
