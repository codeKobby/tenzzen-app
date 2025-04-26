"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * This component handles initializing user data in Convex when a user signs in
 * It should be included in the app layout to run on every page
 */
export function UserInitializer() {
    const { user, isLoaded, isSignedIn } = useUser();
    const [initialized, setInitialized] = useState(false);

    // Get the Convex mutation
    const createOrUpdateUser = useMutation(api.users.createOrUpdateUser);

    useEffect(() => {
        // Only run this effect when auth is loaded and user is signed in
        if (!isLoaded || !isSignedIn || initialized) return;

        const initUser = async () => {
            try {
                // Get user data from Clerk
                if (!user) return;

                const userData = {
                    clerkId: user.id,
                    email: user.emailAddresses[0]?.emailAddress || "",
                    name: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || "",
                    imageUrl: user.imageUrl,
                    // We could also capture IP and user agent if needed
                };

                // Call the Convex mutation to create or update the user
                await createOrUpdateUser(userData);

                // Mark as initialized to prevent repeated calls
                setInitialized(true);
            } catch (error) {
                console.error("Error initializing user:", error);
            }
        };

        initUser();
    }, [isLoaded, isSignedIn, user, createOrUpdateUser, initialized]);

    // This is a utility component that doesn't render anything
    return null;
}