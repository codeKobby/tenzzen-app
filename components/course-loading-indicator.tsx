"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface CourseLoadingIndicatorProps {
  message?: string;
  className?: string;
}

export function CourseLoadingIndicator({
  message = "Our AI is analyzing the content and structuring your learning path...",
  className = "",
}: CourseLoadingIndicatorProps) {
  const [dots, setDots] = useState('');

  // Create a looping dots animation
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-lg font-medium">
        Generating your course<span className="inline-block w-8 text-left">{dots}</span>
      </p>
      <p className="text-sm text-muted-foreground mt-2 text-center max-w-md">
        {message}
      </p>
    </div>
  );
}
