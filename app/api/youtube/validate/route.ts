import { NextResponse } from "next/server"
import { z } from "zod"

const validateSchema = z.object({
  contentType: z.enum(["video", "playlist", "channel"]),
  url: z.string().url(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  aiAnalysis: z.boolean()
})

async function checkYouTubeContent(url: string, contentType: string): Promise<boolean> {
  try {
    // First check if URL is accessible
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error("Content not accessible")
    }

    // For a more robust check, we should use the YouTube Data API
    // This would require setting up YouTube API credentials
    // For now, we'll just verify the response includes expected YouTube content
    const html = await response.text()
    
    if (contentType === "video") {
      if (!html.includes('{"videoId":')) {
        throw new Error("Invalid or private video")
      }
    } else if (contentType === "playlist") {
      if (!html.includes('"playlist":{"playlist"')) {
        throw new Error("Invalid or private playlist")
      }
    } else if (contentType === "channel") {
      if (!html.includes('"channelId":')) {
        throw new Error("Invalid or non-existent channel")
      }
    }

    return true
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to validate content")
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Validate request body schema
    const validatedData = validateSchema.parse(body)
    
    // Check if content exists and is accessible
    await checkYouTubeContent(validatedData.url, validatedData.contentType)
    
    return NextResponse.json({ 
      success: true,
      message: "Content validated successfully" 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request data", errors: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
