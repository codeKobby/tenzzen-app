"use client";

import { useState, useEffect, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
    Play,
    Pause,
    RotateCcw,
    SkipForward,
    Volume2,
    Headphones,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface AudioPlayerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    script: string;
    title: string;
}

interface ScriptLine {
    speaker: string;
    text: string;
}

export function AudioPlayerDialog({
    open,
    onOpenChange,
    script,
    title,
}: AudioPlayerDialogProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentLineIndex, setCurrentLineIndex] = useState(0);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const synth = useRef<SpeechSynthesis | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [parsedScript, setParsedScript] = useState<ScriptLine[]>([]);

    // Parse script on mount/change
    useEffect(() => {
        if (!script) return;
        const lines = script
            .split("\n")
            .filter((line) => line.trim() && line.includes(":"))
            .map((line) => {
                const [speaker, ...textParts] = line.split(":");
                return {
                    speaker: speaker.trim(),
                    text: textParts.join(":").trim(),
                };
            });
        setParsedScript(lines);
    }, [script]);

    // Initialize SpeechSynthesis
    useEffect(() => {
        if (typeof window !== "undefined") {
            synth.current = window.speechSynthesis;
            const updateVoices = () => {
                setVoices(window.speechSynthesis.getVoices());
            };

            updateVoices();
            window.speechSynthesis.onvoiceschanged = updateVoices;

            return () => {
                window.speechSynthesis.cancel();
            };
        }
    }, []);

    // Handle Playback
    useEffect(() => {
        if (!synth.current || parsedScript.length === 0) return;

        if (isPlaying) {
            if (currentLineIndex >= parsedScript.length) {
                setIsPlaying(false);
                setCurrentLineIndex(0);
                return;
            }

            const line = parsedScript[currentLineIndex];
            const utterance = new SpeechSynthesisUtterance(line.text);

            // Simple voice assignment logic
            // Host (Jane) -> Female voice
            // Expert (Alex) -> Male voice
            const femaleVoice = voices.find(
                (v) => v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Google US English")
            );
            const maleVoice = voices.find(
                (v) => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Microsoft Mark")
            );

            // Fallback
            utterance.voice =
                line.speaker.toLowerCase().includes("jane") ||
                    line.speaker.toLowerCase().includes("host")
                    ? femaleVoice || voices[0]
                    : maleVoice || voices[1] || voices[0];

            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onend = () => {
                if (isPlaying) {
                    setCurrentLineIndex((prev) => prev + 1);
                }
            };

            synth.current.speak(utterance);

            // Scroll into view
            const activeElement = document.getElementById(`line-${currentLineIndex}`);
            activeElement?.scrollIntoView({ behavior: "smooth", block: "center" });

        } else {
            synth.current.cancel();
        }

        // Clean up on unmount or pause
        return () => {
            // Only cancel if we are stopping completely or pause was intentional
            // But here we rely on isPlaying driving the loop.
            // The onend trigger of the PREVIOUS utterance drives the NEXT one.
            // If isPlaying becomes false mid-utterance, we want to stop.
        };
    }, [isPlaying, currentLineIndex, parsedScript, voices]);

    // When pausing, we actually want to cancel current speech
    useEffect(() => {
        if (!isPlaying && synth.current) {
            synth.current.cancel();
        }
    }, [isPlaying]);

    const handleReset = () => {
        setIsPlaying(false);
        setCurrentLineIndex(0);
        if (synth.current) synth.current.cancel();
    };

    const skipForward = () => {
        if (synth.current) synth.current.cancel();
        setCurrentLineIndex(prev => Math.min(prev + 1, parsedScript.length - 1));
    };

    const skipBack = () => {
        if (synth.current) synth.current.cancel();
        setCurrentLineIndex(prev => Math.max(prev - 1, 0));
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) {
                setIsPlaying(false);
                if (synth.current) synth.current.cancel();
            }
            onOpenChange(val);
        }}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b bg-muted/30">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Headphones className="h-5 w-5 text-primary" />
                            Audio Overview
                        </DialogTitle>
                        <DialogDescription className="line-clamp-1">
                            {title}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Player Controls */}
                    <div className="flex flex-col items-center gap-4 mt-6">
                        {/* Progress Bar */}
                        <div className="w-full flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{Math.floor((currentLineIndex / Math.max(parsedScript.length, 1)) * 100)}%</span>
                            <div className="h-2 flex-1 bg-secondary rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(currentLineIndex / parsedScript.length) * 100}%` }}
                                    transition={{ duration: 0.5 }}
                                />
                            </div>
                            <span>{parsedScript.length} lines</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={handleReset}>
                                <RotateCcw className="h-5 w-5" />
                            </Button>
                            <Button
                                size="icon"
                                className="h-12 w-12 rounded-full shadow-lg"
                                onClick={() => setIsPlaying(!isPlaying)}
                            >
                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={skipForward}>
                                <SkipForward className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Script Display */}
                <ScrollArea className="flex-1 p-6 h-[400px]" ref={scrollRef}>
                    <div className="space-y-4">
                        {parsedScript.map((line, index) => {
                            const isCurrent = index === currentLineIndex;
                            const isSpeaker1 = line.speaker.toLowerCase().includes("jane") || line.speaker.toLowerCase().includes("host");

                            return (
                                <motion.div
                                    key={index}
                                    id={`line-${index}`}
                                    initial={{ opacity: 0.5 }}
                                    animate={{
                                        opacity: isCurrent ? 1 : 0.5,
                                        scale: isCurrent ? 1.02 : 1,
                                        y: isCurrent ? 0 : 0
                                    }}
                                    className={cn(
                                        "p-4 rounded-xl border transition-all cursor-pointer",
                                        isCurrent ? "bg-primary/5 border-primary/50 shadow-sm" : "bg-card border-transparent hover:bg-muted/50",
                                        "flex gap-4"
                                    )}
                                    onClick={() => {
                                        if (synth.current) synth.current.cancel();
                                        setCurrentLineIndex(index);
                                        // If not playing, start playing
                                        if (!isPlaying) setIsPlaying(true);
                                    }}
                                >
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                                        isSpeaker1 ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                                    )}>
                                        {line.speaker[0]}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold text-muted-foreground">{line.speaker}</p>
                                        <p className={cn("text-sm", isCurrent && "font-medium text-foreground")}>
                                            {line.text}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
