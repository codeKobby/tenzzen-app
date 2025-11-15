"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from './custom-toast';

/**
 * Simple demo component for testing Google AI course generation
 */
export function GoogleAIDemo() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<any>(null);

  // Extract YouTube video ID from URL
  const extractVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Extract video ID
    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      toast.error("Invalid URL", {
        description: "Please enter a valid YouTube video URL"
      });
      return;
    }

    try {
      setIsGenerating(true);
      toast.info("Starting Generation", {
        description: "Fetching video information and generating course..."
      });

      // Fetch video data
      const videoResponse = await fetch(`/api/youtube?id=${videoId}`);
      if (!videoResponse.ok) {
        throw new Error("Failed to fetch video information");
      }

      const videoData = await videoResponse.json();

      // Start course generation
      const response = await fetch('/api/course-generation/google-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          videoTitle: videoData.title,
          videoDescription: videoData.description || '',
          // The transcript would typically be fetched separately
          // but we'll skip that for this demo component
          transcript: ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate course");
      }

      const result = await response.json();

      if (!result.data) {
        throw new Error("No course data returned");
      }

      setGeneratedCourse(result.data);
      toast.success("Course Generated", {
        description: "Your course has been successfully generated!"
      });

    } catch (error) {
      console.error("Error generating course:", error);
      toast.error("Generation Failed", {
        description: error instanceof Error ? error.message : "Failed to generate course"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-2xl font-bold">Google AI Course Generator Demo</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Enter YouTube URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={isGenerating || !videoUrl}>
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Course"
            )}
          </Button>
        </div>
      </form>

      {isGenerating && (
        <div className="py-4 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted-foreground">
            Generating course content with Google AI...
          </p>
        </div>
      )}

      {generatedCourse && (
        <Card className="p-4">
          <h3 className="text-xl font-bold">{generatedCourse.title}</h3>
          <p className="mt-2 text-muted-foreground">{generatedCourse.description}</p>

          <div className="mt-4">
            <h4 className="font-semibold">Sections:</h4>
            <ul className="mt-2 space-y-2">
              {generatedCourse.sections.map((section: any) => (
                <li key={section.id} className="border-l-2 border-primary pl-4">
                  <span className="font-medium">{section.title}</span>
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setGeneratedCourse(null)}
            >
              Clear Results
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}