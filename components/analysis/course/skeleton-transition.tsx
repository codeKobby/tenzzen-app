import * as React from "react";
import { cn } from "@/lib/utils";
import { CourseSkeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

interface SkeletonTransitionProps {
  show: boolean;
  className?: string;
}

export function SkeletonTransition({ show, className }: SkeletonTransitionProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={cn("absolute inset-0 z-10", className)}
        >
          <div className="h-full w-full bg-background/80 backdrop-blur-sm p-4">
            <CourseSkeleton className="mx-auto max-w-3xl" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ContentTransitionProps {
  show: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ContentTransition({ show, children, className }: ContentTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}