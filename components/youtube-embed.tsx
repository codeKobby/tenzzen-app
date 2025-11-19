"use client"

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react'
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
    onProgressUpdate?: (progress: number) => void
    onVideoEnd?: () => void
    onTimeUpdate?: (currentTimeSeconds: number) => void

    onSeekBeyondLesson?: (targetTime: number) => Promise<boolean> // Returns true if should allow seek
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
    destroy: () => void;
    mute: () => void;
    unMute: () => void;
    loadVideoById: (args: { videoId: string; startSeconds: number; endSeconds: number | undefined; suggestedQuality: string; }) => void;
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
    type = 'youtube',
    onProgressUpdate,
    onVideoEnd,
    onTimeUpdate,
    onSeekBeyondLesson
}: YouTubeEmbedProps) {
    const [isPiP, setIsPiP] = useState(false)
    const [iframeLoaded, setIframeLoaded] = useState(false)
    // Initialize apiReady based on whether YouTube API is already loaded
    const [apiReady, setApiReady] = useState(() => {
        if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
            console.log('[YouTubeEmbed] YouTube API already loaded on init')
            return true
        }
        return false
    })
    const [playerError, setPlayerError] = useState(false)

    // Use refs instead of state for player to avoid re-render loops
    const ytPlayerRef = useRef<YouTubePlayerInstance | null>(null)

    // Use useRef for interval instead of useState to avoid re-render loops
    const timeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const seekVerifyIntervalRef = useRef<NodeJS.Timeout | null>(null)

    // Track last valid time to detect seeks
    const lastValidTimeRef = useRef<number>(startTime)
    const isProcessingSeekRef = useRef<boolean>(false)

    // Track the current video/time range to detect changes
    const currentVideoIdRef = useRef<string>(videoId)
    const currentStartRef = useRef<number | undefined>(startTime)
    const currentEndRef = useRef<number | undefined>(endTime)
    const isInitializingRef = useRef<boolean>(false)
    const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const hasAutoplayedOnceRef = useRef<boolean>(false)
    const lastTimeReportRef = useRef<number>(0)
    const unstartedRetryCountRef = useRef<number>(0)
    const endCallbackFiredRef = useRef<boolean>(false)
    const isProgrammaticLoadRef = useRef<boolean>(false) // <-- Add this ref
    const programmaticPauseAttemptsRef = useRef<number>(0)

    // Single iframe reference
    const iframeRef = useRef<HTMLDivElement>(null) // <-- Correct the type here
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
    const getEmbedUrl = useCallback((id: string, start: number = 0, end?: number) => {
        if (type === 'youtube') {
            // Ensure we have a valid video ID
            if (!id || id.trim() === '') {
                console.warn("Invalid YouTube video ID, using fallback");
                id = "dQw4w9WgXcQ"; // Default fallback video
            }

            const params = new URLSearchParams({
                rel: '0',
                showinfo: '0',
                modestbranding: '1',
                enablejsapi: '1',
                // origin: typeof window !== "undefined" ? window.location.origin : '', // Conditionally set later
                controls: '1',
                iv_load_policy: '3', // Hide annotations
                fs: '1', // Allow fullscreen
                playsinline: '1', // Play inline on mobile
                disablekb: '0', // Enable keyboard controls
            })

            // Conditionally add origin for non-localhost environments to reduce console noise
            if (typeof window !== "undefined" && window.location.hostname !== 'localhost') {
                params.append('origin', window.location.origin);
            }

            // Add start time if specified and greater than 0
            if (start > 0) {
                params.append('start', Math.floor(start).toString())
            }

            // Add end time if specified and greater than start
            if (end && end > start) {
                params.append('end', Math.floor(end).toString())
            }

            if (autoplay) params.append('autoplay', '1')
            if (mute) params.append('mute', '1')

            // Add playlist parameter with the same video ID to enable looping
            // This is required for the 'end' parameter to work properly
            params.append('playlist', id)

            return `https://www.youtube.com/embed/${id}?${params.toString()}`;
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
    }, [type, autoplay, mute])

    // Memoize embed URL to prevent unnecessary recalculations
    const embedUrl = useMemo(() => getEmbedUrl(videoId, startTime, endTime), [getEmbedUrl, videoId, startTime, endTime])

    // Load YouTube API - check on every mount
    useEffect(() => {
        // Only load YouTube API for YouTube videos
        if (type !== 'youtube') {
            return;
        }

        // Check if API is already loaded
        if (window.YT && window.YT.Player) {
            console.log('[YouTubeEmbed] YouTube API already loaded')
            setApiReady(true)
            return
        }

        console.log('[YouTubeEmbed] Loading YouTube API')

        // Create script tag for YouTube IFrame API only if not already present
        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]')
        if (!existingScript) {
            const tag = document.createElement('script')
            tag.src = 'https://www.youtube.com/iframe_api'

            // Add callback function to be called when API is ready
            window.onYouTubeIframeAPIReady = () => {
                console.log('[YouTubeEmbed] YouTube API ready callback fired')
                setApiReady(true)
            }

            // Add script tag to document
            const firstScriptTag = document.getElementsByTagName('script')[0]
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
        } else {
            console.log('[YouTubeEmbed] YouTube API script already in DOM, waiting for it to load')
            // Script exists but API might not be ready yet, set up callback
            if (window.YT && window.YT.Player) {
                setApiReady(true)
            } else {
                window.onYouTubeIframeAPIReady = () => {
                    console.log('[YouTubeEmbed] YouTube API ready callback fired (delayed)')
                    setApiReady(true)
                }
            }
        }

        // Cleanup - don't remove the script or callback as it's shared
        return () => {
            // Don't clean up global YouTube API state
        }
    }, [type]) // Only depend on type, check API state on every mount

    // Initialize YouTube player when container is ready and API is ready
    useEffect(() => {
        if (type !== 'youtube' || !apiReady || !iframeRef.current || !iframeLoaded) {
            console.log('[YouTubeEmbed] Waiting for prerequisites:', { type, apiReady, hasIframe: !!iframeRef.current, iframeLoaded })
            return
        }

        // Only initialize if player doesn't already exist and not currently initializing
        if (ytPlayerRef.current || isInitializingRef.current) {
            console.log('[YouTubeEmbed] Player already exists or initializing, skipping')
            return
        }

        console.log('[YouTubeEmbed] Initializing player for video:', videoId)
        isInitializingRef.current = true
        setPlayerError(false)

        // Set a timeout to detect if player gets stuck (but don't error immediately)
        if (initTimeoutRef.current) {
            clearTimeout(initTimeoutRef.current)
        }
        initTimeoutRef.current = setTimeout(() => {
            if (isInitializingRef.current && !ytPlayerRef.current) {
                console.warn('[YouTubeEmbed] Player initialization taking longer than expected')
                // Give it more time before showing error
                setTimeout(() => {
                    if (isInitializingRef.current && !ytPlayerRef.current) {
                        console.error('[YouTubeEmbed] Player initialization timeout - showing error')
                        setPlayerError(true)
                        isInitializingRef.current = false
                    }
                }, 15000) // Additional 15 seconds (20 total)
            }
        }, 5000) // Initial 5 second warning

        // Use a simpler approach without explicitly defining types
        // This avoids conflicts with existing type declarations
        if (window.YT && iframeRef.current.id) {
            // Wait a tick to ensure DOM is fully ready
            setTimeout(() => {
                if (!iframeRef.current) {
                    console.warn('[YouTubeEmbed] Iframe ref lost during initialization')
                    isInitializingRef.current = false
                    return
                }

                try {
                    console.log('[YouTubeEmbed] Creating player with iframe ID:', iframeRef.current.id)
                    // Create YouTube player instance using existing YT object
                    // @ts-ignore - Using YT API but avoiding type conflicts
                    const player = new window.YT.Player(iframeRef.current.id, {
                        videoId: videoId,
                        playerVars: {
                            autoplay: 1, // Let YouTube's API handle autoplay
                            start: startTime || 0,
                            end: endTime || undefined,
                            modestbranding: 1,
                            rel: 0,
                            enablejsapi: 1,
                            playsinline: 1
                        },
                        events: {
                            'onReady': (event: any) => {
                                console.log('[YouTubeEmbed] YouTube player ready for:', videoId)
                                if (initTimeoutRef.current) {
                                    clearTimeout(initTimeoutRef.current)
                                    initTimeoutRef.current = null
                                }
                                ytPlayerRef.current = event.target
                                isInitializingRef.current = false
                                setPlayerError(false)

                                // Handle autoplay policy: mute only for the very first autoplay
                                try {
                                    if (autoplay) {
                                        if (!hasAutoplayedOnceRef.current) {
                                            if (event.target.mute) event.target.mute()
                                            if (event.target.playVideo) event.target.playVideo()
                                            hasAutoplayedOnceRef.current = true
                                        } else {
                                            if (event.target.unMute) event.target.unMute()
                                            if (event.target.playVideo) event.target.playVideo()
                                        }
                                        unstartedRetryCountRef.current = 0
                                    }
                                } catch (e) {
                                    console.warn('[YouTubeEmbed] Autoplay handling error:', e)
                                }
                            },
                            'onStateChange': (event: any) => {
                                // Check if player is still valid
                                if (!ytPlayerRef.current) {
                                    return
                                }

                                // Log state changes for debugging
                                const stateNames: { [key: number]: string } = {
                                    '-1': 'UNSTARTED',
                                    '0': 'ENDED',
                                    '1': 'PLAYING',
                                    '2': 'PAUSED',
                                    '3': 'BUFFERING',
                                    '5': 'CUED'
                                }
                                const stateName = stateNames[event.data] || event.data
                                console.log('[YouTubeEmbed] Player state changed to:', stateName)

                                // Idempotent Playback Kick: If a programmatic load is followed by a PAUSE, try to nudge it back to PLAY.
                                // But avoid infinite force-play loops: only attempt a small number of times.
                                // @ts-ignore
                                if (event.data === window.YT.PlayerState.PAUSED && isProgrammaticLoadRef.current) {
                                    // Only attempt force-play if autoplay is expected
                                    if (autoplay) {
                                        const attempts = programmaticPauseAttemptsRef.current || 0
                                        if (attempts < 2) {
                                            programmaticPauseAttemptsRef.current = attempts + 1
                                            console.log('[YouTubeEmbed] Playback kick: Detected PAUSE after programmatic load. Forcing play. Attempt', programmaticPauseAttemptsRef.current)
                                            try {
                                                if (event.target.playVideo) event.target.playVideo()
                                            } catch (e) {
                                                console.warn('[YouTubeEmbed] Playback kick failed:', e)
                                            }
                                        } else {
                                            // Give up forcing play to avoid loops and clear the programmatic flag
                                            console.warn('[YouTubeEmbed] Giving up force-play after multiple attempts')
                                            isProgrammaticLoadRef.current = false
                                            programmaticPauseAttemptsRef.current = 0
                                        }
                                    }
                                }

                                // When the video is cued, it's safe to seek.
                                // @ts-ignore
                                if (event.data === window.YT.PlayerState.CUED) {
                                    console.log('[YouTubeEmbed] Video cued, seeking to start time:', startTime);
                                    event.target.seekTo(startTime, true);
                                    // After cue + seek, try to play if autoplay desired
                                    try {
                                        if (autoplay && event.target.playVideo) {
                                            event.target.playVideo()
                                        }
                                    } catch { }
                                    endCallbackFiredRef.current = false
                                    // Reset programmatic pause attempts on successful cue
                                    programmaticPauseAttemptsRef.current = 0
                                }

                                // If player goes to UNSTARTED after we tried to play, retry
                                // @ts-ignore
                                if (event.data === window.YT.PlayerState.UNSTARTED && !isInitializingRef.current) {
                                    if (unstartedRetryCountRef.current < 5) {
                                        unstartedRetryCountRef.current += 1
                                        const attempt = unstartedRetryCountRef.current
                                        console.log('[YouTubeEmbed] Player UNSTARTED, retrying play. Attempt', attempt)
                                        setTimeout(() => {
                                            try {
                                                if (ytPlayerRef.current) {
                                                    // Nudge by seeking to start and then playing
                                                    if (typeof startTime === 'number' && ytPlayerRef.current.seekTo) {
                                                        ytPlayerRef.current.seekTo(startTime || 0, true)
                                                    }
                                                    if (!hasAutoplayedOnceRef.current && ytPlayerRef.current.mute) {
                                                        ytPlayerRef.current.mute()
                                                    }
                                                    if (ytPlayerRef.current.playVideo) ytPlayerRef.current.playVideo()
                                                }
                                            } catch (e) {
                                                console.error('[YouTubeEmbed] Error restarting playback:', e)
                                            }
                                        }, 350 * attempt)
                                    } else {
                                        console.warn('[YouTubeEmbed] UNSTARTED persists after retries')
                                    }
                                }

                                // If YouTube signals ENDED, trigger callback once
                                // @ts-ignore
                                if (event.data === window.YT.PlayerState.ENDED) {
                                    if (timeCheckIntervalRef.current) {
                                        clearInterval(timeCheckIntervalRef.current)
                                        timeCheckIntervalRef.current = null
                                    }
                                    if (!endCallbackFiredRef.current) {
                                        endCallbackFiredRef.current = true
                                        if (onVideoEnd) onVideoEnd()
                                    }
                                }

                                // Store player reference to use in interval
                                const playerInstance = event.target

                                // Watch for state changes to enforce end time
                                // @ts-ignore - Using YT API but avoiding type conflicts
                                if (event.data === window.YT.PlayerState.PLAYING && endTime) {
                                    // Clear any existing interval
                                    if (timeCheckIntervalRef.current) {
                                        clearInterval(timeCheckIntervalRef.current)
                                    }

                                    // Set interval to check time and stop video at end time
                                    const interval = setInterval(async () => {
                                        try {
                                            // Check if player still exists and is valid
                                            if (!ytPlayerRef.current || !playerInstance || typeof playerInstance.getCurrentTime !== 'function') {
                                                return
                                            }

                                            // If we're in the middle of a programmatic load (lesson change), skip enforcement
                                            if (isProgrammaticLoadRef.current) {
                                                try {
                                                    const curProgTime = playerInstance.getCurrentTime()
                                                    lastValidTimeRef.current = curProgTime
                                                } catch { }
                                                return
                                            }

                                            const currentTime = playerInstance.getCurrentTime()
                                            const lastTime = lastValidTimeRef.current

                                            const EPS = 0.75
                                            // Detect seeks beyond lesson boundaries (forward OR backward)
                                            const seekJump = currentTime - lastTime
                                            const crossedForwardBoundary = endTime && currentTime > endTime + EPS && lastTime <= endTime
                                            const crossedBackwardBoundary = startTime !== undefined && currentTime < (startTime - EPS) && lastTime >= startTime

                                            // First handle natural end-of-segment before interpreting as a seek
                                            if (endTime && currentTime >= endTime - EPS && currentTime >= lastTime) {
                                                playerInstance.pauseVideo()
                                                if (timeCheckIntervalRef.current) {
                                                    clearInterval(timeCheckIntervalRef.current)
                                                    timeCheckIntervalRef.current = null
                                                }
                                                if (!endCallbackFiredRef.current) {
                                                    endCallbackFiredRef.current = true
                                                    if (onVideoEnd) onVideoEnd()
                                                }
                                                return
                                            }

                                            // If user makes a large in-bounds seek, accept it and cancel verification
                                            if (Math.abs(seekJump) > 1 && startTime !== undefined && (endTime === undefined || (currentTime >= startTime && currentTime <= endTime))) {
                                                if (seekVerifyIntervalRef.current) {
                                                    clearInterval(seekVerifyIntervalRef.current)
                                                    seekVerifyIntervalRef.current = null
                                                }
                                                isProgrammaticLoadRef.current = false
                                                // Reset any programmatic pause attempts since the user performed an in-bounds seek
                                                programmaticPauseAttemptsRef.current = 0
                                                lastValidTimeRef.current = currentTime
                                            }

                                            // Forward seek beyond lesson end
                                            if (!isProcessingSeekRef.current && crossedForwardBoundary && seekJump > 2) {
                                                console.log('[YouTubeEmbed] Forward seek detected:', { currentTime, lastTime, endTime, seekJump })
                                                isProcessingSeekRef.current = true

                                                // IMMEDIATELY revert the seek first
                                                const revertPosition = Math.min(lastTime, endTime)
                                                console.log('[YouTubeEmbed] Reverting seek to:', revertPosition)
                                                playerInstance.seekTo(revertPosition, true)
                                                playerInstance.pauseVideo()

                                                // Ask for confirmation if callback provided
                                                if (onSeekBeyondLesson) {
                                                    console.log('[YouTubeEmbed] Calling onSeekBeyondLesson with:', currentTime)
                                                    const allowSeek = await onSeekBeyondLesson(currentTime)
                                                    console.log('[YouTubeEmbed] onSeekBeyondLesson returned:', allowSeek)

                                                    if (allowSeek) {
                                                        console.log('[YouTubeEmbed] User confirmed, lesson will change via parent component')
                                                        // Parent component will handle lesson change
                                                        // Video will be reloaded with new lesson
                                                    } else {
                                                        console.log('[YouTubeEmbed] User cancelled, staying at current position')
                                                        playerInstance.playVideo()
                                                    }
                                                } else {
                                                    // No callback, enforce boundary
                                                    playerInstance.seekTo(endTime, true)
                                                }

                                                isProcessingSeekRef.current = false
                                                // Reset programmatic pause attempts after handling seek revert
                                                programmaticPauseAttemptsRef.current = 0
                                                return
                                            }

                                            // Backward seek before lesson start
                                            if (!isProcessingSeekRef.current && crossedBackwardBoundary && seekJump < -2) {
                                                console.log('[YouTubeEmbed] Backward seek detected:', { currentTime, lastTime, startTime, seekJump })
                                                isProcessingSeekRef.current = true

                                                // IMMEDIATELY revert the seek first
                                                const revertPosition = Math.max(lastTime, startTime)
                                                console.log('[YouTubeEmbed] Reverting seek to:', revertPosition)
                                                playerInstance.seekTo(revertPosition, true)
                                                playerInstance.pauseVideo()

                                                // Ask for confirmation if callback provided
                                                if (onSeekBeyondLesson) {
                                                    console.log('[YouTubeEmbed] Calling onSeekBeyondLesson with:', currentTime)
                                                    const allowSeek = await onSeekBeyondLesson(currentTime)
                                                    console.log('[YouTubeEmbed] onSeekBeyondLesson returned:', allowSeek)

                                                    if (allowSeek) {
                                                        console.log('[YouTubeEmbed] User confirmed, lesson will change via parent component')
                                                        // Parent component will handle lesson change
                                                        // Video will be reloaded with new lesson
                                                    } else {
                                                        console.log('[YouTubeEmbed] User cancelled, staying at current position')
                                                        playerInstance.playVideo()
                                                    }
                                                } else {
                                                    // No callback, enforce boundary
                                                    playerInstance.seekTo(startTime, true)
                                                }

                                                isProcessingSeekRef.current = false
                                                programmaticPauseAttemptsRef.current = 0
                                                return
                                            }

                                            // Small seeks before startTime (without modal) - just enforce boundary
                                            if (startTime !== undefined && currentTime < startTime && Math.abs(seekJump) <= 1) {
                                                playerInstance.seekTo(startTime, true)
                                                lastValidTimeRef.current = startTime
                                                return
                                            }

                                            // If within bounds, update last valid time
                                            if (currentTime >= startTime && currentTime <= endTime) {
                                                lastValidTimeRef.current = currentTime
                                            }

                                            // Note: natural end handled above

                                            // Calculate progress if callback provided
                                            if (onProgressUpdate && endTime && startTime !== undefined) {
                                                const duration = endTime - startTime
                                                const elapsed = currentTime - startTime
                                                const progressPercent = Math.min(100, Math.max(0, (elapsed / duration) * 100))
                                                onProgressUpdate(progressPercent)
                                            }

                                            // Throttled absolute time update callback (every ~2s)
                                            if (onTimeUpdate) {
                                                const now = Date.now()
                                                if (now - lastTimeReportRef.current >= 2000) {
                                                    lastTimeReportRef.current = now
                                                    onTimeUpdate(currentTime)
                                                }
                                            }
                                        } catch (err) {
                                            console.error('Error in time check interval:', err)
                                            if (timeCheckIntervalRef.current) {
                                                clearInterval(timeCheckIntervalRef.current)
                                                timeCheckIntervalRef.current = null
                                            }
                                            isProcessingSeekRef.current = false
                                        }
                                    }, 100)

                                    timeCheckIntervalRef.current = interval
                                    // @ts-ignore - Using YT API but avoiding type conflicts
                                } else if (event.data !== window.YT.PlayerState.PLAYING && timeCheckIntervalRef.current) {
                                    // Clear interval if video is not playing
                                    clearInterval(timeCheckIntervalRef.current)
                                    timeCheckIntervalRef.current = null
                                }
                            }
                        }
                    });
                } catch (e) {
                    console.error('[YouTubeEmbed] Error initializing YouTube player:', e);
                    isInitializingRef.current = false
                    setPlayerError(true)
                    if (initTimeoutRef.current) {
                        clearTimeout(initTimeoutRef.current)
                        initTimeoutRef.current = null
                    }
                }
            }, 100) // 100ms delay to ensure DOM is ready
        } else {
            console.warn('[YouTubeEmbed] Missing prerequisites for player init:', { hasYT: !!window.YT, hasIframe: !!iframeRef.current, iframeId: iframeRef.current?.id })
            isInitializingRef.current = false
        }

        // Cleanup
        return () => {
            console.log('[YouTubeEmbed] Cleaning up player')

            // Clear all timers and intervals first
            if (initTimeoutRef.current) {
                clearTimeout(initTimeoutRef.current)
                initTimeoutRef.current = null
            }
            if (timeCheckIntervalRef.current) {
                clearInterval(timeCheckIntervalRef.current)
                timeCheckIntervalRef.current = null
            }
            if (seekVerifyIntervalRef.current) {
                clearInterval(seekVerifyIntervalRef.current)
                seekVerifyIntervalRef.current = null
            }

            // Reset all flags
            isInitializingRef.current = false
            isProcessingSeekRef.current = false
            lastValidTimeRef.current = 0

            // Destroy player on unmount
            if (ytPlayerRef.current) {
                try {
                    if (ytPlayerRef.current.destroy) {
                        ytPlayerRef.current.destroy()
                    }
                } catch (e) {
                    console.error('Error destroying player in cleanup:', e)
                }
                ytPlayerRef.current = null
            }
        }
    }, [apiReady, iframeLoaded, type])

    // When the lesson/video or time range changes, reuse the same player and load the new segment
    useEffect(() => {
        if (type !== 'youtube') return
        if (!ytPlayerRef.current) return

        const videoChanged = currentVideoIdRef.current !== videoId
        const startChanged = currentStartRef.current !== startTime
        const endChanged = currentEndRef.current !== endTime
        if (!videoChanged && !startChanged && !endChanged) return

        try {
            const safeEnd = (typeof endTime === 'number' && typeof startTime === 'number' && endTime > startTime)
                ? endTime
                : undefined
            console.log('[YouTubeEmbed] Loading new video/range via loadVideoById', { videoId, startTime, endTime: safeEnd ?? endTime })

            // Clear any existing time-check interval to avoid race with previous lesson's enforcement
            if (timeCheckIntervalRef.current) {
                clearInterval(timeCheckIntervalRef.current)
                timeCheckIntervalRef.current = null
            }

            // Set the flag before programmatic load
            isProgrammaticLoadRef.current = true

            // @ts-ignore
            ytPlayerRef.current.loadVideoById({
                videoId,
                startSeconds: startTime || 0,
                endSeconds: safeEnd,
                suggestedQuality: 'default'
            })
            lastValidTimeRef.current = startTime || 0
            unstartedRetryCountRef.current = 0
            endCallbackFiredRef.current = false
            isProcessingSeekRef.current = false
            currentVideoIdRef.current = videoId
            currentStartRef.current = startTime
            currentEndRef.current = endTime

            // Explicitly seek and try to play after programmatic load
            setTimeout(() => {
                try {
                    const p = ytPlayerRef.current
                    if (!p) return
                    if (typeof startTime === 'number' && p.seekTo) p.seekTo(startTime || 0, true)
                    if (!hasAutoplayedOnceRef.current && p.mute) p.mute()
                    p.playVideo?.()
                } catch (e) {
                    console.warn('[YouTubeEmbed] Post-load play attempt failed:', e)
                }
            }, 100)

            // Short verification loop to ensure position snaps to startTime
            if (seekVerifyIntervalRef.current) {
                clearInterval(seekVerifyIntervalRef.current)
                seekVerifyIntervalRef.current = null
            }
            let verifyAttempts = 0
            seekVerifyIntervalRef.current = setInterval(() => {
                try {
                    if (!isProgrammaticLoadRef.current) {
                        clearInterval(seekVerifyIntervalRef.current as NodeJS.Timeout)
                        seekVerifyIntervalRef.current = null
                        return
                    }
                    const p = ytPlayerRef.current as any
                    if (!p || typeof p.getCurrentTime !== 'function') return
                    const cur = p.getCurrentTime()
                    const desired = startTime || 0
                    const delta = Math.abs(cur - desired)
                    verifyAttempts += 1
                    if (delta > 0.75) {
                        p.seekTo(desired, true)
                        lastValidTimeRef.current = desired
                    } else {
                        clearInterval(seekVerifyIntervalRef.current as NodeJS.Timeout)
                        seekVerifyIntervalRef.current = null
                        isProgrammaticLoadRef.current = false
                    }
                    if (verifyAttempts >= 15) {
                        clearInterval(seekVerifyIntervalRef.current as NodeJS.Timeout)
                        seekVerifyIntervalRef.current = null
                        isProgrammaticLoadRef.current = false
                    }
                } catch { }
            }, 150)

        } catch (e) {
            console.error('[YouTubeEmbed] Error calling loadVideoById:', e)
            isProgrammaticLoadRef.current = false // Reset flag on error
        }
    }, [videoId, startTime, endTime, type])

    // Handle iframe load events
    const handleIframeLoad = () => {
        console.log('[YouTubeEmbed] Iframe loaded')
        setIframeLoaded(true)
    }

    // Mark container as loaded once on mount (YouTube API will create iframe inside)
    useEffect(() => {
        console.log('[YouTubeEmbed] Container ready, marking as loaded')
        setIframeLoaded(true)
    }, [])

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
            if (timeCheckIntervalRef.current) {
                clearInterval(timeCheckIntervalRef.current);
                timeCheckIntervalRef.current = null;
            }
        };
    }, []);

    return (
        <>
            {/* Main container - always present */}
            <div
                ref={embedRef}
                className={`aspect-video w-full bg-muted rounded-md overflow-hidden relative ${className}`}
            >
                {/* Create the div container for YouTube player - API will create iframe inside */}
                {!isPiP && type === 'youtube' && (
                    <>
                        <div
                            id={`youtube-player-root`}
                            ref={iframeRef as any}
                            className="w-full h-full"
                        />
                        {/* Fallback direct link in case iframe doesn't load */}
                        <div className="absolute bottom-2 right-2 z-10 opacity-70 hover:opacity-100">
                            <a
                                href={`https://www.youtube.com/watch?v=${videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs bg-black/70 text-white px-2 py-1 rounded-md"
                            >
                                Open in YouTube
                            </a>
                        </div>
                    </>
                )}

                {!iframeLoaded && !isPiP && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        {playerError ? (
                            <div className="text-center">
                                <div className="text-muted-foreground mb-2">Video failed to load</div>
                                <button
                                    onClick={() => {
                                        console.log('[YouTubeEmbed] Retry clicked')
                                        setPlayerError(false)
                                        setIframeLoaded(false)
                                        currentVideoIdRef.current = ''
                                        window.location.reload()
                                    }}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <div className="animate-pulse text-muted-foreground">Loading video...</div>
                        )}
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
