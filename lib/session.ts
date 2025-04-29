import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { UserRole } from "@/convex/validation";

// Define user type for getCurrentUser function
interface User {
  id: Id<"users">;
  name?: string;
  email?: string;
  role: UserRole;
  image?: string;
}

export async function getCurrentUser(): Promise<User | null> {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }
  
  // Create a Convex HTTP client for server-side operations
  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  
  try {
    // Get user information from Convex using the Clerk ID
    const userData = await convex.query(api.users.getCurrentUser, { clerkId: userId });
    
    if (!userData || !userData.user) {
      return null;
    }
    
    return {
      id: userData.user._id,
      name: userData.user.name,
      email: userData.user.email,
      role: userData.user.role || "user", // Default to "user" if role is not set
      image: userData.user.imageUrl
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}