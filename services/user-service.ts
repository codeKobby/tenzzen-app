// Supabase integration removed.
// The application no longer uses Supabase — use Convex-backed queries/actions instead.
// Keeping placeholder exports that throw useful errors if accidentally imported.

const errorMessage =
  "Supabase integration was removed from this repository. Use Convex queries/actions instead.";

export async function getCurrentUser() {
  throw new Error(errorMessage);
}

export async function getUserByClerkId(_clerkId: string) {
  throw new Error(errorMessage);
}

export async function getUserProfile(_userId?: string) {
  throw new Error(errorMessage);
}

export async function getUserStats(_userId?: string) {
  throw new Error(errorMessage);
}

export async function updateUserProfile(_profileData: any) {
  throw new Error(errorMessage);
}
