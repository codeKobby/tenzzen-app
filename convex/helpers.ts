import { QueryCtx, MutationCtx } from "./_generated/server"

// Type for authenticated context
export type AuthenticatedCtx = {
  userId: string
  email?: string | null
  name?: string | null
}

// Helper to ensure user is authenticated
export async function requireAuthentication(ctx: QueryCtx | MutationCtx): Promise<AuthenticatedCtx> {
  const identity = await ctx.auth.getUserIdentity()
  if (!identity) {
    throw new Error("Not authenticated")
  }

  return {
    userId: identity.subject,
    email: identity.email,
    name: identity.name
  }
}

// Helper to get a video by ID with authentication check
export async function getVideoWithAuth(
  ctx: QueryCtx,
  videoId: string,
  requireOwnership: boolean = false
) {
  const auth = await requireAuthentication(ctx)
  
  const video = await ctx.db
    .query("videos")
    .filter((q) => q.eq(q.field("id"), videoId))
    .first()

  if (!video) {
    throw new Error("Video not found")
  }

  if (requireOwnership && video.userId !== auth.userId) {
    throw new Error("Not authorized")
  }

  return video
}

// Helper to format dates consistently
export function formatDate(date: string | Date): string {
  return new Date(date).toISOString()
}

// Helper to validate video data
export function validateVideoData(data: any) {
  if (!data.id || !data.title) {
    throw new Error("Video must have an ID and title")
  }
  
  // Add any other validation logic here
  return data
}
