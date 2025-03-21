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
    autoplay?: boolean
    mute?: boolean
}

export function YouTubeEmbed({
    videoId,
    title = 'YouTube video player',
    className,
    enablePiP = false,
    startTime = 0,
    autoplay = false,
    mute = false
}: YouTubeEmbedProps) {
    const [isPiP, setIsPiP] = useState(false)
    const [currentTime, setCurrentTime] = useState(startTime)
    const [iframeLoaded, setIframeLoaded] = useState(false)
    const [pipIframeLoaded, setPipIframeLoaded] = useState(false)
    const embedRef = useRef<HTMLDivElement>(null)
    const mainIframeRef = useRef<HTMLIFrameElement>(null)
    const pipIframeRef = useRef<HTMLIFrameElement>(null)
    const pipContainerRef = useRef<HTMLDivElement>(null)
    
    // Dragging state
    const [isDragging, setIsDragging] = useState(false)
    // Position PiP in the bottom right corner by default
    const [pipPosition, setPipPosition] = useState({ 
        x: typeof window !== "undefined" ? window.innerWidth - 280 : 16,
        y: typeof window !== "undefined" ? window.innerHeight - 180 : 80
    })
    const dragStartRef = useRef({ x: 0, y: 0 })

    // Build YouTube URL parameters
    const getYouTubeEmbedUrl = (id: string, time: number = 0) => {
        const params = new URLSearchParams({
            rel: '0',
            showinfo: '0',
            modestbranding: '1',
            enablejsapi: '1',
            start: time.toString()
        })

        if (autoplay) params.append('autoplay', '1')
        if (mute) params.append('mute', '1')

        return `https://www.youtube.com/embed/${id}?${params.toString()}`
    }

    // Update source with current time when toggling PiP
    const updateVideoTime = () => {
        if (!isPiP && mainIframeRef.current) {
            try {
                // We can't directly access the iframe content due to security restrictions,
                // But we can record the time when the PiP is triggered
                setCurrentTime(Math.floor(Date.now() / 1000) - Math.floor(startTime))
            } catch (e) {
                console.error('Failed to get current time from YouTube player', e)
            }
        }
    }

    // Handle iframe load events
    const handleIframeLoad = (isPipFrame = false) => {
        if (isPipFrame) {
            setPipIframeLoaded(true);
        } else {
            setIframeLoaded(true);
        }
    }

    // Mouse dragging handlers for PiP - Only activate on actual drag, not just click
    const handlePipMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only handle left mouse button
        
        // Use the drag handle or entire container except buttons
        if (pipContainerRef.current && 
            (e.target === pipContainerRef.current || 
             e.currentTarget === pipContainerRef.current)) {
            
            e.preventDefault();
            
            // Start drag only if it's a drag action (we'll determine this on move)
            dragStartRef.current = {
                x: e.clientX - pipPosition.x,
                y: e.clientY - pipPosition.y
            };

            // Add event listeners for move and up events
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
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
        
        // Reset dragging state after a short delay to prevent immediate click events
        setTimeout(() => {
            setIsDragging(false);
        }, 0);
    };

    // Touch handlers for mobile devices - Only activate on actual drag
    const handlePipTouchStart = (e: React.TouchEvent) => {
        if (pipContainerRef.current && 
            (e.target === pipContainerRef.current || 
             e.currentTarget === pipContainerRef.current)) {
            
            // Don't prevent default immediately as that would prevent scrolling
            
            const touch = e.touches[0];
            dragStartRef.current = {
                x: touch.clientX - pipPosition.x,
                y: touch.clientY - pipPosition.y
            };
            
            // Add event listeners for move and end events
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
            window.addEventListener('touchcancel', handleTouchEnd);
        }
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

    // Set up mouse and touch event listeners
    useEffect(() => {
        if (isDragging) {
            // Mouse events
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            
            // Touch events
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd);
            window.addEventListener('touchcancel', handleTouchEnd);
            
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('touchend', handleTouchEnd);
                window.removeEventListener('touchcancel', handleTouchEnd);
            };
        }
    }, [isDragging]);

    // Pre-load the PiP iframe in the background
    useEffect(() => {
        if (!enablePiP || isPiP) return;

        // Create a hidden iframe to preload the YouTube player
        const preloadIframe = document.createElement('iframe');
        preloadIframe.src = getYouTubeEmbedUrl(videoId, startTime);
        preloadIframe.style.display = 'none';
        document.body.appendChild(preloadIframe);
        
        return () => {
            document.body.removeChild(preloadIframe);
        };
    }, [enablePiP, videoId, startTime]);

    // Set up intersection observer to detect when video is scrolled out of view
    useEffect(() => {
        if (!enablePiP) return;

        const observer = new IntersectionObserver(
            entries => {
                // Only activate PiP when the video is completely out of view
                if (entries[0].intersectionRatio === 0) {
                    updateVideoTime();
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
    }, [enablePiP, videoId]);

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

    return (
        <>
            {/* Main embed */}
            <div
                ref={embedRef}
                className={`aspect-video w-full bg-muted rounded-md overflow-hidden relative ${className}`}
            >
                <iframe
                    ref={mainIframeRef}
                    className="w-full h-full"
                    src={getYouTubeEmbedUrl(videoId, startTime)}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => handleIframeLoad(false)}
                />
                {!iframeLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="animate-pulse text-muted-foreground">Loading video...</div>
                    </div>
                )}
            </div>

            {/* Draggable PiP embed with touch support */}
            <div
                ref={pipContainerRef}
                onMouseDown={handlePipMouseDown}
                onTouchStart={handlePipTouchStart}
                style={{ 
                    position: 'fixed',
                    left: `${pipPosition.x}px`, 
                    top: `${pipPosition.y}px`,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    width: '256px',
                    zIndex: 50,
                }}
                className={`aspect-video shadow-lg rounded-md overflow-hidden border border-border transition-all duration-300 ease-in-out ${
                    isPiP ? 'opacity-100' : 'opacity-0 pointer-events-none translate-y-10'
                }`}
            >
                {/* Drag handle overlay - only appears when hovering */}
                <div 
                    className="absolute inset-0 z-10 bg-black/0 hover:bg-black/10 transition-colors"
                    style={{ touchAction: 'none' }}
                >
                    <div className="absolute top-2 left-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        Drag to move
                    </div>
                </div>
                
                <iframe
                    ref={pipIframeRef}
                    className="w-full h-full"
                    src={getYouTubeEmbedUrl(videoId, currentTime)}
                    title={`${title} (Picture in Picture)`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => handleIframeLoad(true)}
                    style={{ pointerEvents: isDragging ? 'none' : 'auto' }}
                />
                
                {!pipIframeLoaded && isPiP && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                        <div className="animate-pulse text-muted-foreground">Loading video...</div>
                    </div>
                )}
                
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
