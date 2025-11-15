import { auth } from "@clerk/nextjs/server";
import { createClient } from '@supabase/supabase-js';
import { Id } from "@/types/convex-types";

// Define user role type
export type UserRole = "user" | "admin" | "moderator" | "instructor";

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

  // Create a Supabase client for server-side operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Get user information from Supabase using the Clerk ID
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error || !userData) {
      console.error("Error fetching user from Supabase:", error);
      return null;
    }

    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role || "user", // Default to "user" if role is not set
      image: userData.image_url
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return null;
  }
}