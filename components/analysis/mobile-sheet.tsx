"use client";

import { Button } from "@/components/ui/button";
import { VideoContent } from "@/components/analysis/video-content";
import { VideoContentSkeleton } from "@/components/analysis/video-content-skeleton";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
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
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg sm:hidden"
        >
          <PanelLeftClose className="h-5 w-5" />
          <span className="sr-only">Toggle content panel</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="h-[80vh] mt-16 p-0 sm:hidden"
      >
        <SheetHeader className="h-14 border-b px-4 flex items-center">
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
