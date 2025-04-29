// filepath: c:\Users\kgeor\Desktop\New folder (2)\tenzzen-app\app\admin\utils\auth.ts
import { cookies } from "next/headers";

export type UserRole = "user" | "admin" | "moderator";

export interface User {
  id: string;
  name?: string;
  email?: string;
  role: UserRole;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    // In a real implementation, you would validate the session token
    // and fetch the user data from your database
    const cookiesStore = await cookies();
    const sessionCookie = cookiesStore.get("session");
    
    if (!sessionCookie?.value) {
      return null;
    }
    
    // This is a simplified version - in a real app, you would decode and validate
    // the session token and fetch the user from your database
    
    // For testing purposes, we're returning a mock admin user
    // Replace this with your actual authentication logic
    return {
      id: "admin-user-id",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin"
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}