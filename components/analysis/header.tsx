"use client";

import React from "react"; // Ensure React is imported
import { useAnalysis } from "@/hooks/use-analysis-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "@/hooks/use-router-with-loader"; // Router with loader
import { getNavigateBackPath } from "@/lib/utils/navigation"; // Keep for back button

export function AnalysisHeader() {
  const { videoData, setShowAlert, courseData, toggle, isOpen } = useAnalysis(); // Get needed context
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
    <header className="sticky top-0 z-40 w-full border-b bg-background shadow-sm">
      <div className="mx-auto w-[95%] lg:w-[90%] flex h-16 items-center justify-between transition-all duration-300 ease-in-out">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:bg-transparent"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 transition-colors hover:text-primary" />
            </Button>
            <div className="h-4 w-px bg-border" />
          </div>

          {/* Mobile Sheet Trigger */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 hover:bg-transparent sm:hidden"
            onClick={() => toggle(!isOpen)}
          >
            <Menu className="h-4 w-4 transition-colors hover:text-primary" />
            <span className="sr-only">Toggle content panel</span>
          </Button>
        </div>

        {/* Title */}
        <div className="flex-1 text-center truncate px-4">
          <h1 className="text-lg font-semibold truncate">
            {videoData?.title || "Video Analysis"}
          </h1>
        </div>

        {/* Placeholder for right actions */}
        <div className="w-9"></div>
      </div>
    </header>
  );
}
