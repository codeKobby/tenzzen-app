import { ConvexHttpClient } from "convex/browser"
import { api } from "../convex/_generated/api"

// Create a client for server-side API calls
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!
const convexClient = new ConvexHttpClient(convexUrl)

// Export server-side client
export { convexClient as convex }
export { api }

// Re-export types
export type { VideoDetails, PlaylistDetails } from "@/types/youtube"
