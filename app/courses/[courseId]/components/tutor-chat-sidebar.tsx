"use client"

import { useState, useRef, useEffect, KeyboardEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Bot,
    Send,
    Sparkles,
    Trash2,
    User,
    Loader2,
    AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTutorChat } from "@/hooks/use-tutor-chat"
import { Id } from "@/convex/_generated/dataModel"
import Markdown from "react-markdown"

interface TutorChatSidebarProps {
    courseId: string
    lessonId: string
    lessonContext?: {
        title: string
        content: string
        keyPoints: string[]
    }
}

export function TutorChatSidebar({
    courseId,
    lessonId,
    lessonContext
}: TutorChatSidebarProps) {
    const [inputValue, setInputValue] = useState("")
    const scrollRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const {
        messages,
        streamingMessage,
        isLoading,
        error,
        sendMessage,
        clearChat,
        isSignedIn
    } = useTutorChat({
        courseId: courseId as Id<"courses">,
        lessonId: lessonId as Id<"lessons">,
        lessonContext
    })

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages, streamingMessage])

    const handleSend = async () => {
        if (!inputValue.trim() || isLoading) return
        const message = inputValue
        setInputValue("")
        await sendMessage(message)
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    // Quick prompts for common questions
    const quickPrompts = [
        "Explain this concept",
        "Give me an example",
        "What are the key points?",
        "Quiz me on this"
    ]

    if (!isSignedIn) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-violet-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">AI Tutor</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Sign in to chat with your AI tutor and get personalized help with this lesson.
                </p>
                <Button asChild className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white">
                    <a href="/sign-in">Sign In</a>
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">AI Tutor</h3>
                        <p className="text-[10px] text-muted-foreground">Context-aware assistance</p>
                    </div>
                </div>
                {messages.length > 0 && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
                        onClick={clearChat}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-3" ref={scrollRef}>
                {messages.length === 0 && !streamingMessage ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/10 to-blue-500/10 flex items-center justify-center mb-3">
                            <Bot className="h-6 w-6 text-violet-400/60" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
                            Ask me anything about this lesson. I'm here to help!
                        </p>
                        {/* Quick Prompts */}
                        <div className="flex flex-wrap gap-2 justify-center">
                            {quickPrompts.map((prompt, idx) => (
                                <Button
                                    key={idx}
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] h-7 border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                    onClick={() => sendMessage(prompt)}
                                >
                                    {prompt}
                                </Button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex gap-2",
                                    msg.role === "user" ? "justify-end" : "justify-start"
                                )}
                            >
                                {msg.role === "assistant" && (
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot className="h-3 w-3 text-white" />
                                    </div>
                                )}
                                <div
                                    className={cn(
                                        "max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm",
                                        msg.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-br-sm"
                                            : "bg-muted text-foreground rounded-bl-sm"
                                    )}
                                >
                                    {msg.role === "assistant" ? (
                                        <div className="prose prose-invert prose-sm max-w-none text-foreground [&>p]:mb-2 [&>p:last-child]:mb-0">
                                            <Markdown>{msg.content}</Markdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                                        <User className="h-3 w-3 text-white" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Streaming Message */}
                        {streamingMessage && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0 mt-1">
                                    <Bot className="h-3 w-3 text-white" />
                                </div>
                                <div className="max-w-[85%] rounded-xl rounded-bl-sm px-3 py-2 text-sm bg-white/10 text-white/90">
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <Markdown>{streamingMessage}</Markdown>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Loading Indicator */}
                        {isLoading && !streamingMessage && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                                    <Loader2 className="h-3 w-3 text-white animate-spin" />
                                </div>
                                <div className="rounded-xl rounded-bl-sm px-3 py-2 text-sm bg-muted text-muted-foreground">
                                    Thinking...
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Error Display */}
            {error && (
                <div className="mx-3 mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{error.message}</span>
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-t border-border/50">
                <div className="flex gap-2">
                    <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question..."
                        className="flex-1 h-9 bg-background/50 border-input text-foreground placeholder:text-muted-foreground text-sm focus-visible:ring-violet-500"
                        disabled={isLoading}
                    />
                    <Button
                        size="icon"
                        className="h-9 w-9 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white"
                        onClick={handleSend}
                        disabled={!inputValue.trim() || isLoading}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    )
}
