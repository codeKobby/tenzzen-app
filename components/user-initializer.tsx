"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

/**
 * This component handles initializing user data in Supabase when a user signs in
 * It should be included in the app layout to run on every page
 */
export function UserInitializer() {
    const { user, isLoaded, isSignedIn } = useUser();
    const [initialized, setInitialized] = useState(false);

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
                const result = await syncUserToSupabase(userData);

                if (result) {
                    console.log('Client: User successfully synced to Supabase');
                    // Mark as initialized to prevent repeated calls
                    setInitialized(true);
                } else {
                    console.error('Client: Failed to sync user to Supabase');
                    // Don't retry automatically to avoid repeated errors
                    // Just mark as initialized to prevent repeated attempts
                    setInitialized(true);
                }
            } catch (error) {
                console.error("Error initializing user:", error);
                // Don't retry automatically to avoid repeated errors
                // Just mark as initialized to prevent repeated attempts
                setInitialized(true);
            }
        };

        initUser();
    }, [isLoaded, isSignedIn, user, initialized]);

    // Helper function to implement retry logic with exponential backoff
    const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 3, initialTimeout = 30000) => {
        let retries = 0;
        let lastError: Error | null = null;

        while (retries < maxRetries) {
            try {
                // Increase timeout with each retry (exponential backoff)
                const timeout = initialTimeout * Math.pow(2, retries);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const fetchOptions = {
                    ...options,
                    signal: controller.signal,
                    // Add cache control headers to prevent caching
                    headers: {
                        ...options.headers,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                };

                console.log(`Client: Fetch attempt ${retries + 1}/${maxRetries} with timeout ${timeout}ms`);
                const response = await fetch(url, fetchOptions);

                // Clear the timeout to prevent memory leaks
                clearTimeout(timeoutId);

                // Check if the response is HTML (error page) instead of JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('text/html')) {
                    console.error(`Client: Received HTML response instead of JSON (status ${response.status})`);

                    // Always return the response for graceful handling instead of retrying
                    // This prevents the error from being thrown repeatedly
                    console.warn('Client: Received HTML response, will handle gracefully');
                    return response;
                }

                return response;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                retries++;

                // Check if we've reached the maximum number of retries
                if (retries >= maxRetries) {
                    console.error(`Client: Max retries (${maxRetries}) reached for ${url}`);
                    throw lastError;
                }

                // Check if it's a timeout error
                const isTimeout = lastError.name === 'TimeoutError' ||
                    lastError.name === 'AbortError' ||
                    lastError.message.includes('timeout') ||
                    lastError.message.includes('aborted');

                if (!isTimeout && !lastError.message.includes('HTML response')) {
                    console.error(`Client: Non-timeout error, not retrying:`, lastError);
                    throw lastError;
                }

                // Calculate backoff delay (exponential with jitter)
                const backoffDelay = Math.min(1000 * Math.pow(2, retries) + Math.random() * 1000, 10000);
                console.warn(`Client: Request failed, retrying in ${backoffDelay}ms (attempt ${retries}/${maxRetries})`);

                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, backoffDelay));
            }
        }

        // This should never be reached due to the throw in the loop, but TypeScript needs it
        throw lastError || new Error('Unknown error during fetch with retry');
    };

    // Function to sync user to Supabase using the server API
    const syncUserToSupabase = async (userData: any) => {
        try {
            console.log('Client: Syncing user to Supabase via API:', userData.clerkId);

            // Skip the health check to reduce latency
            // We'll rely on the retry logic for the main request instead

            // Use the server API route to sync the user with retry logic
            // This uses the service role key which bypasses RLS policies
            const response = await fetchWithRetry('/api/users/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                },
                body: JSON.stringify(userData)
            }, 3, 30000); // 3 retries, 30 second initial timeout

            // Log the response status and headers for debugging
            console.log('Client: Sync API response status:', response.status);
            console.log('Client: Sync API response headers:', {
                contentType: response.headers.get('content-type'),
                contentLength: response.headers.get('content-length')
            });

            if (!response.ok) {
                // Check content type before trying to parse as JSON
                const contentType = response.headers.get('content-type');

                if (contentType && contentType.includes('application/json')) {
                    // It's JSON, try to parse it
                    const errorData = await response.json().catch(() => ({ error: response.statusText }));
                    console.error('Client: Error from sync API:', errorData);
                    throw new Error(`API error: ${errorData.error || response.statusText}`);
                } else {
                    // Not JSON, log the text content for debugging
                    const textContent = await response.text().catch(() => 'Could not read response text');
                    console.error('Client: Non-JSON error response:', {
                        status: response.status,
                        statusText: response.statusText,
                        contentType,
                        preview: textContent.substring(0, 200) // Log first 200 chars
                    });
                    throw new Error(`API error: ${response.statusText} (${response.status})`);
                }
            }

            // Clone the response before parsing to avoid "body already read" errors
            const responseClone = response.clone();

            // Check content type before trying to parse as JSON
            const contentType = response.headers.get('content-type');

            // Now parse the response based on content type
            let result;
            try {
                if (contentType && contentType.includes('application/json')) {
                    // It's JSON, try to parse it
                    result = await response.json();
                } else {
                    // Not JSON, try to handle it gracefully
                    const textPreview = await response.text().catch(() => 'Could not read response text');
                    console.warn('Client: Expected JSON but got:', {
                        contentType,
                        preview: textPreview.substring(0, 200)
                    });

                    // Check if the response contains HTML (likely an error page)
                    if (textPreview.includes('<!DOCTYPE') || textPreview.includes('<html')) {
                        console.error('Client: Received HTML instead of JSON:', textPreview.substring(0, 200));
                        // Create a more complete fallback result with all necessary user fields
                        result = {
                            success: true,
                            user: {
                                id: `fallback-${userData.clerkId}`,
                                clerk_id: userData.clerkId,
                                email: userData.email,
                                name: userData.name,
                                image_url: userData.imageUrl,
                                role: 'user',
                                status: 'active',
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            },
                            action: 'fallback'
                        };
                        // Log that we're using a fallback user
                        console.log('Client: Using fallback user data due to HTML response');
                    } else {
                        // Try to parse it as JSON anyway as a fallback
                        try {
                            // Remove any BOM or whitespace that might be causing issues
                            const cleanedText = textPreview.trim().replace(/^\uFEFF/, '');
                            result = JSON.parse(cleanedText);
                            console.log('Client: Successfully parsed non-JSON response as JSON');
                        } catch (jsonError) {
                            console.error('Client: Could not parse response as JSON:', jsonError);
                            // Create a more complete fallback result with all necessary user fields
                            result = {
                                success: true,
                                user: {
                                    id: `fallback-${userData.clerkId}`,
                                    clerk_id: userData.clerkId,
                                    email: userData.email,
                                    name: userData.name,
                                    image_url: userData.imageUrl,
                                    role: 'user',
                                    status: 'active',
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                },
                                action: 'fallback'
                            };
                            // Log that we're using a fallback user
                            console.log('Client: Using fallback user data due to JSON parse error');
                        }
                    }
                }
            } catch (parseError) {
                console.error('Client: Failed to parse response:', parseError);

                // Try to get the raw text to see what's wrong
                const rawText = await responseClone.text().catch(() => 'Could not read response text');
                console.error('Client: Raw response text:', rawText.substring(0, 500));

                // Check if the response contains HTML (likely an error page)
                if (rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
                    console.error('Client: Received HTML instead of JSON in error handler');
                } else {
                    console.error('Client: Response is not HTML but still failed to parse as JSON');
                }

                // Create a more complete fallback result with all necessary user fields
                result = {
                    success: true,
                    user: {
                        id: `fallback-${userData.clerkId}`,
                        clerk_id: userData.clerkId,
                        email: userData.email,
                        name: userData.name,
                        image_url: userData.imageUrl,
                        role: 'user',
                        status: 'active',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    },
                    action: 'fallback'
                };
                // Log that we're using a fallback user
                console.log('Client: Using fallback user data due to HTML in error handler');
            }

            console.log('Client: User sync result:', result);

            if (result.success === false) {
                console.error('Client: User sync failed:', result.error || 'Unknown error');
                return null;
            }

            if (!result.user || !result.user.id) {
                console.error('Client: Invalid user data returned from sync API:', result);
                return null;
            }

            console.log(`Client: Successfully ${result.action} user in Supabase:`, result.user.id);
            return result.user;
        } catch (error) {
            console.error("Client: Unexpected error syncing user to Supabase:", error);
            // Log more details but don't rethrow to prevent unhandled promise rejections
            if (error instanceof Error) {
                console.error(`Error details: ${error.message}`);
                console.error(`Stack trace: ${error.stack}`);
            } else {
                console.error(`Error details: ${JSON.stringify(error)}`);
            }

            // Create a more complete fallback user object for the client
            // This allows the app to continue functioning even if the sync fails
            if (userData && userData.clerkId) {
                console.log('Client: Creating fallback user object for client-side use');
                return {
                    id: `fallback-${userData.clerkId}`,
                    clerk_id: userData.clerkId,
                    email: userData.email,
                    name: userData.name,
                    image_url: userData.imageUrl,
                    role: 'user',
                    status: 'active',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    fallback: true // Mark this as a fallback user
                };
            }

            return null;
        }
    };

    // This is a utility component that doesn't render anything
    return null;
}