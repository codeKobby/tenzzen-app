"use client";

import { Button } from "@/components/ui/button";
import { VideoContent } from "@/components/analysis/video-content";
import { VideoContentSkeleton } from "@/components/analysis/video-content-skeleton";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PanelLeftClose } from "lucide-react";
import { useEffect } from "react";

interface MobileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export function MobileSheet({ isOpen, onClose, loading, error }: MobileSheetProps) {
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      {/* SheetTrigger is now in the header component */}
      <SheetContent
        side="bottom"
        className="h-[80vh] mt-16 p-0 sm:hidden rounded-t-lg"
      >
        <SheetHeader className="h-14 border-b px-4 flex items-center justify-between">
          <SheetTitle className="sr-only">Video Content</SheetTitle>
          <SheetClose className="text-muted-foreground">Close</SheetClose>
        </SheetHeader>
        <ScrollArea className="h-[calc(80vh-3.5rem)]">
          <div className="px-4 py-6">
            {loading ? (
              <VideoContentSkeleton />
            ) : (
              <VideoContent error={error} />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
