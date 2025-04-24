"use client";

import React from "react"; // Ensure React is imported
import { useAnalysis } from "@/hooks/use-analysis-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation"; // Keep router for back button
import { getNavigateBackPath } from "@/lib/utils/navigation"; // Keep for back button

export function AnalysisHeader() {
  const { videoData, setShowAlert, courseData } = useAnalysis(); // Get needed context
  const router = useRouter();

  // Simplified back handler
  const handleBack = () => {
    if (courseData) { // Keep alert logic if needed
      setShowAlert(true);
      return;
    }
    const backPath = getNavigateBackPath();
    router.push(backPath);
  };

  // Simplified return statement
  return (
    <header className="flex items-center justify-between h-16 px-4 border-b bg-background sticky top-0 z-20">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 hover:bg-transparent"
        onClick={handleBack}
      >
        <ArrowLeft className="h-4 w-4 transition-colors hover:text-primary" />
      </Button>

      {/* Title */}
      <div className="flex-1 text-center truncate px-4">
        <h1 className="text-lg font-semibold truncate">
          {videoData?.title || "Video Analysis"}
        </h1>
      </div>

      {/* Placeholder for right actions */}
      <div className="w-9"></div>
    </header>
  );
}
