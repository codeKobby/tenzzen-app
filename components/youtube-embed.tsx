"use client"

import React, { useRef, useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface YouTubeEmbedProps {
    videoId: string
    title?: string
    className?: string
    enablePiP?: boolean
    startTime?: number
    endTime?: number
    autoplay?: boolean
    mute?: boolean
    type?: 'youtube' | 'vimeo'
}

// Remove the incorrect import
// import type { YouTubePlayer } from 'youtube-player'

// Define a minimal YouTube player type locally instead of importing it
type YouTubePlayerInstance = {
    getCurrentTime: () => number;
    getDuration: () => number;
    seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
    playVideo: () => void;
    pauseVideo: () => void;
    getPlayerState: () => number;
}

// Define a minimal YouTube player configuration if needed for compatibility
interface YouTubePlayerConfig {
    videoId?: string;
    width?: number | string;
    height?: number | string;
    playerVars?: {
        autoplay?: 0 | 1;
        cc_load_policy?: 1;
        color?: 'red' | 'white';
        controls?: 0 | 1 | 2;
        disablekb?: 0 | 1;
        enablejsapi?: 0 | 1;
        end?: number;
        fs?: 0 | 1;
        hl?: string;
        iv_load_policy?: 1 | 3;
        list?: string;
        listType?: 'playlist' | 'search' | 'user_uploads';
        loop?: 0 | 1;
        modestbranding?: 0 | 1;
        origin?: string;
        playlist?: string;
        playsinline?: 0 | 1;
        rel?: 0 | 1;
        start?: number;
        mute?: 0 | 1;
    };
    events?: {
        onReady?: (event: { target: any }) => void;
        onStateChange?: (event: { data: number; target: any }) => void;
        onPlaybackQualityChange?: (event: { data: string; target: any }) => void;
        onPlaybackRateChange?: (event: { data: number; target: any }) => void;
        onError?: (event: { data: number; target: any }) => void;
        onApiChange?: (event: { target: any }) => void;
    };
}

// Use the existing window declaration and just augment it for Vimeo if needed
declare global {
    interface Window {
        onYouTubeIframeAPIReady?: () => void;
    }
}

export function YouTubeEmbed({
    videoId,
    title = 'Video player',
    className,
    enablePiP = false,
    startTime = 0,
    endTime,
    autoplay = false,
    mute = false,
    type = 'youtube'
}: YouTubeEmbedProps) {
    const [isPiP, setIsPiP] = useState(false)
    const [iframeLoaded, setIframeLoaded] = useState(false)
    const [ytPlayer, setYtPlayer] = useState<YouTubePlayerInstance | null>(null)
    const [apiReady, setApiReady] = useState(false)
    const [timeCheckInterval, setTimeCheckInterval] = useState<NodeJS.Timeout | null>(null)

    // Single iframe reference
    const iframeRef = useRef<HTMLIFrameElement>(null)
    const embedRef = useRef<HTMLDivElement>(null)
    const pipContainerRef = useRef<HTMLDivElement>(null)
    const originalParentRef = useRef<HTMLElement | null>(null)
    const originalPositionRef = useRef<{ top: number; left: number; width: number; height: number } | null>(null)

    // Dragging state
    const [isDragging, setIsDragging] = useState(false)
    const [pipPosition, setPipPosition] = useState({
        x: typeof window !== "undefined" ? window.innerWidth - 280 : 16,
        y: typeof window !== "undefined" ? window.innerHeight - 180 : 80
    })
    const dragStartRef = useRef({ x: 0, y: 0 })

    // Build embed URL based on platform type
    const getEmbedUrl = (id: string, start: number = 0, end?: number) => {
        if (type === 'youtube') {
            const params = new URLSearchParams({
                rel: '0',
                showinfo: '0',
                modestbranding: '1',
                enablejsapi: '1',
                origin: typeof window !== "undefined" ? window.location.origin : '',
                start: start.toString(),
            })

            // Add end time if specified
            if (end && end > start) {
                params.append('end', end.toString())
            }

            if (autoplay) params.append('autoplay', '1')
            if (mute) params.append('mute', '1')

            return `https://www.youtube.com/embed/${id}?${params.toString()}`
        } else if (type === 'vimeo') {
            const params = new URLSearchParams({
                title: '0',
                byline: '0',
                portrait: '0',
                autopause: '0'
            })

            if (autoplay) params.append('autoplay', '1')
            if (mute) params.append('muted', '1')
            if (start > 0) params.append('t', start.toString())

            return `https://player.vimeo.com/video/${id}?${params.toString()}`
        }

        return ''
    }

    // Load YouTube API
    useEffect(() => {
        // Only load YouTube API for YouTube videos
        if (type !== 'youtube') {
            return;
        }

        if (window.YT) {
            setApiReady(true)
            return
        }

        // Create script tag for YouTube IFrame API
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'

        // Add callback function to be called when API is ready
        window.onYouTubeIframeAPIReady = () => {
            setApiReady(true)
        }

        // Add script tag to document
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)

        // Cleanup
        return () => {
            window.onYouTubeIframeAPIReady = undefined
        }
    }, [type])

    // Initialize YouTube player when iframe is loaded and API is ready
    useEffect(() => {
        if (type !== 'youtube' || !apiReady || !iframeRef.current || !iframeLoaded) return

        // Use a simpler approach without explicitly defining types
        // This avoids conflicts with existing type declarations
        if (window.YT && iframeRef.current.id) {
            try {
                // Create YouTube player instance using existing YT object
                // @ts-ignore - Using YT API but avoiding type conflicts
                const player = new window.YT.Player(iframeRef.current.id, {
                    events: {
                        'onReady': (event: any) => {
                            setYtPlayer(event.target)
                        },
                        'onStateChange': (event: any) => {
                            // Watch for state changes to enforce end time
                            // @ts-ignore - Using YT API but avoiding type conflicts
                            if (event.data === window.YT.PlayerState.PLAYING && endTime) {
                                // Clear any existing interval
                                if (timeCheckInterval) {
                                    clearInterval(timeCheckInterval)
                                }

                                // Set interval to check time and stop video at end time
                                const interval = setInterval(() => {
                                    const currentTime = event.target.getCurrentTime()
                                    if (currentTime >= endTime) {
                                        event.target.pauseVideo()
                                        clearInterval(interval)
                                        setTimeCheckInterval(null)
                                    }
                                }, 100)

                                setTimeCheckInterval(interval)
                                // @ts-ignore - Using YT API but avoiding type conflicts
                            } else if (event.data !== window.YT.PlayerState.PLAYING && timeCheckInterval) {
                                // Clear interval if video is not playing
                                clearInterval(timeCheckInterval)
                                setTimeCheckInterval(null)
                            }
                        }
                    }
                });
            } catch (e) {
                console.error("Error initializing YouTube player:", e);
            }
        }

        // Cleanup
        return () => {
            if (timeCheckInterval) {
                clearInterval(timeCheckInterval)
            }
        }
    }, [apiReady, iframeLoaded, endTime, timeCheckInterval, type, videoId])

    // Handle iframe load events
    const handleIframeLoad = () => {
        setIframeLoaded(true)
    }

    // Mouse and touch events for PiP dragging
    const handlePipMouseDown = (e: React.MouseEvent) => {
        // Only if clicking on the container, not the iframe or close button
        if (e.target !== pipContainerRef.current) return;
        if (e.button !== 0) return; // Only handle left mouse button

        // Set up initial position for drag
        dragStartRef.current = {
            x: e.clientX - pipPosition.x,
            y: e.clientY - pipPosition.y
        };

        // Add event listeners for move and up events
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        // If we haven't set isDragging yet, this is the first move event
        if (!isDragging) {
            setIsDragging(true);
        }

        const maxX = window.innerWidth - 256; // Width of PiP
        const maxY = window.innerHeight - 144; // Height of PiP

        const newX = Math.min(Math.max(0, e.clientX - dragStartRef.current.x), maxX);
        const newY = Math.min(Math.max(0, e.clientY - dragStartRef.current.y), maxY);

        setPipPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
        // Clean up event listeners
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);

        // Reset dragging state after a short delay
        setTimeout(() => {
            setIsDragging(false);
        }, 0);
    };

    // Touch handlers for mobile devices
    const handlePipTouchStart = (e: React.TouchEvent) => {
        // Only if touching the container, not the iframe or close button
        if (e.target !== pipContainerRef.current) return;

        const touch = e.touches[0];
        dragStartRef.current = {
            x: touch.clientX - pipPosition.x,
            y: touch.clientY - pipPosition.y
        };

        // Add event listeners for move and end events
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleTouchEnd);
        window.addEventListener('touchcancel', handleTouchEnd);
    };

    const handleTouchMove = (e: TouchEvent) => {
        // Now we know it's a drag, so prevent default (scrolling)
        e.preventDefault();

        // Set dragging state on first move
        if (!isDragging) {
            setIsDragging(true);
        }

        const touch = e.touches[0];
        const maxX = window.innerWidth - 256;
        const maxY = window.innerHeight - 144;

        const newX = Math.min(Math.max(0, touch.clientX - dragStartRef.current.x), maxX);
        const newY = Math.min(Math.max(0, touch.clientY - dragStartRef.current.y), maxY);

        setPipPosition({ x: newX, y: newY });
    };

    const handleTouchEnd = () => {
        // Clean up event listeners
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
        window.removeEventListener('touchcancel', handleTouchEnd);

        // Reset dragging state with a delay
        setTimeout(() => {
            setIsDragging(false);
        }, 0);
    };

    // Move the iframe between containers when PiP state changes
    useEffect(() => {
        const iframe = iframeRef.current;
        const embedContainer = embedRef.current;
        const pipContainer = pipContainerRef.current;

        if (!iframe || !embedContainer || !pipContainer) return;

        if (isPiP) {
            // Save the original parent and position
            originalParentRef.current = iframe.parentElement;
            const rect = iframe.getBoundingClientRect();
            originalPositionRef.current = {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            };

            // Move iframe to the PiP container
            pipContainer.appendChild(iframe);

            // Apply PiP styles to iframe
            iframe.style.width = "100%";
            iframe.style.height = "100%";

        } else if (originalParentRef.current) {
            // Move iframe back to its original container
            originalParentRef.current.appendChild(iframe);

            // Reset iframe styles
            iframe.style.width = "100%";
            iframe.style.height = "100%";
        }
    }, [isPiP]);

    // Set up intersection observer to detect when video is scrolled out of view
    useEffect(() => {
        if (!enablePiP) return;

        const observer = new IntersectionObserver(
            entries => {
                // Only activate PiP when the video is completely out of view
                if (entries[0].intersectionRatio === 0) {
                    setIsPiP(true);
                } else {
                    setIsPiP(false);
                }
            },
            { threshold: 0 } // Trigger when element is completely out of view
        );

        if (embedRef.current) {
            observer.observe(embedRef.current);
        }

        return () => observer.disconnect();
    }, [enablePiP]);

    // Update position on window resize
    useEffect(() => {
        const handleResize = () => {
            // Keep in viewport when window is resized
            const maxX = window.innerWidth - 256;
            const maxY = window.innerHeight - 144;

            setPipPosition(prev => ({
                x: Math.min(prev.x, maxX),
                y: Math.min(prev.y, maxY)
            }));
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Cleanup when component unmounts
    useEffect(() => {
        return () => {
            if (timeCheckInterval) {
                clearInterval(timeCheckInterval);
            }
        };
    }, [timeCheckInterval]);

    return (
        <>
            {/* Main container - always present */}
            <div
                ref={embedRef}
                className={`aspect-video w-full bg-muted rounded-md overflow-hidden relative ${className}`}
            >
                {/* Create the iframe in the main container initially */}
                {!isPiP && (
                    <iframe
                        key="video-player"
                        id="youtube-player" // Add an ID for the Player constructor
                        ref={iframeRef}
                        className="w-full h-full"
                        src={getEmbedUrl(videoId, startTime, endTime)}
                        title={title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        onLoad={handleIframeLoad}
                    />
                )}

                {!iframeLoaded && !isPiP && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="animate-pulse text-muted-foreground">Loading video...</div>
                    </div>
                )}

                {/* Show placeholder when in PiP mode */}
                {isPiP && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                        <div className="text-muted-foreground text-sm">Video playing in Picture-in-Picture mode</div>
                    </div>
                )}
            </div>

            {/* PiP container - the iframe will be moved here when in PiP mode */}
            <div
                ref={pipContainerRef}
                onMouseDown={handlePipMouseDown}
                onTouchStart={handlePipTouchStart}
                style={{
                    position: 'fixed',
                    left: `${pipPosition.x}px`,
                    top: `${pipPosition.y}px`,
                    width: '256px',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: 50,
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                }}
                className={`aspect-video shadow-lg rounded-md overflow-hidden border border-border transition-all duration-300 ease-in-out ${isPiP ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-10'
                    }`}
            >
                {/* The iframe will be moved here when in PiP mode by the useEffect */}

                {/* Transparent overlay to help with dragging */}
                <div
                    className="absolute inset-0 bg-transparent z-10"
                    style={{
                        touchAction: 'none',
                        pointerEvents: 'none'
                    }}
                />

                {/* Close button */}
                <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-70 hover:opacity-100 z-20"
                    onClick={() => setIsPiP(false)}
                >
                    <X className="h-3 w-3" />
                </Button>
            </div>
        </>
    )
}
