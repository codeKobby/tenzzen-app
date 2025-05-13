"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabase } from "@/contexts/supabase-context";

/**
 * This component handles initializing user data in Supabase when a user signs in
 * It should be included in the app layout to run on every page
 */
export function UserInitializer() {
    const { user, isLoaded, isSignedIn } = useUser();
    const [initialized, setInitialized] = useState(false);
    const supabase = useSupabase();

    useEffect(() => {
        // Only run this effect when auth is loaded and user is signed in
        if (!isLoaded || !isSignedIn || initialized) return;

        const initUser = async () => {
            try {
                // Get user data from Clerk
                if (!user) return;

                // We'll assume tables exist and handle errors gracefully
                console.log('Client: Initializing user in Supabase...');

                const userData = {
                    clerkId: user.id,
                    email: user.emailAddresses[0]?.emailAddress || "",
                    name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "",
                    imageUrl: user.imageUrl,
                    // We could also capture IP and user agent if needed
                };

                // Sync user to Supabase
                await syncUserToSupabase(userData);

                // Mark as initialized to prevent repeated calls
                setInitialized(true);
            } catch (error) {
                console.error("Error initializing user:", error);
            }
        };

        initUser();
    }, [isLoaded, isSignedIn, user, initialized, supabase]);

    // Function to sync user to Supabase using the server API
    const syncUserToSupabase = async (userData: any) => {
        try {
            console.log('Client: Syncing user to Supabase via API:', userData.clerkId);

            // Use the server API route to sync the user
            // This uses the service role key which bypasses RLS policies
            const response = await fetch('/api/users/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Client: Error from sync API:', errorData);
                throw new Error(`API error: ${errorData.error || response.statusText}`);
            }

            const result = await response.json();
            console.log(`Client: Successfully ${result.action} user in Supabase:`, result.user?.id);

            return result.user;
        } catch (error) {
            console.error("Client: Unexpected error syncing user to Supabase:", error);
            // Rethrow with more details to help debugging
            if (error instanceof Error) {
                throw new Error(`Error creating user in Supabase: ${error.message}`);
            } else {
                throw new Error(`Error creating user in Supabase: ${JSON.stringify(error)}`);
            }
        }
    };

    // This is a utility component that doesn't render anything
    return null;
}