"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@clerk/nextjs";

interface UseTutorChatProps {
  courseId: Id<"courses">;
  lessonId: Id<"lessons">;
  lessonContext?: {
    title: string;
    content: string;
    keyPoints: string[];
  };
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export function useTutorChat({
  courseId,
  lessonId,
  lessonContext,
}: UseTutorChatProps) {
  const { userId, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");

  // Convex mutations and queries
  const sendMessageMutation = useMutation(api.tutorChat.sendMessage);
  const clearChatMutation = useMutation(api.tutorChat.clearLessonChat);

  // Get chat history from Convex
  const chatHistory = useQuery(
    api.tutorChat.getChatHistory,
    userId && lessonId ? { userId, lessonId } : "skip",
  );

  // Format messages for display
  const messages: ChatMessage[] = (chatHistory || []).map((msg) => ({
    id: msg._id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.createdAt,
  }));

  // Send a message to the AI tutor
  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!userId || !isSignedIn) {
        setError(new Error("Please sign in to use the AI tutor"));
        return;
      }

      if (!userMessage.trim()) return;

      setIsLoading(true);
      setError(null);
      setStreamingMessage("");

      try {
        // Save user message to Convex
        await sendMessageMutation({
          userId,
          courseId,
          lessonId,
          content: userMessage,
          role: "user",
        });

        // Call AI API for response
        const response = await fetch("/api/tutor-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: userMessage,
            courseId,
            lessonId,
            lessonContext,
            chatHistory: messages.slice(-10), // Last 10 messages for context
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to get AI response");
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            fullResponse += chunk;
            setStreamingMessage(fullResponse);
          }
        } else {
          // Fallback for non-streaming
          const data = await response.json();
          fullResponse = data.response;
        }

        // Save assistant response to Convex
        await sendMessageMutation({
          userId,
          courseId,
          lessonId,
          content: fullResponse,
          role: "assistant",
        });

        setStreamingMessage("");
      } catch (err) {
        console.error("Error sending message:", err);
        setError(
          err instanceof Error ? err : new Error("Failed to send message"),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [
      userId,
      isSignedIn,
      courseId,
      lessonId,
      lessonContext,
      messages,
      sendMessageMutation,
    ],
  );

  // Clear chat history
  const clearChat = useCallback(async () => {
    if (!userId) return;

    try {
      await clearChatMutation({ userId, lessonId });
    } catch (err) {
      console.error("Error clearing chat:", err);
      setError(err instanceof Error ? err : new Error("Failed to clear chat"));
    }
  }, [userId, lessonId, clearChatMutation]);

  return {
    messages,
    streamingMessage,
    isLoading,
    error,
    sendMessage,
    clearChat,
    isSignedIn,
  };
}
