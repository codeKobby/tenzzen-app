"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  onWidthChange?: (width: number) => void;
}

export function ResizablePanel({
  defaultWidth = 400,
  minWidth = 320,
  maxWidth = 600,
  onWidthChange,
  className,
  children,
  ...props
}: ResizablePanelProps) {
  const [width, setWidth] = React.useState(defaultWidth);
  const [isResizing, setIsResizing] = React.useState(false);
  const resizableRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      if (resizableRef.current) {
        const newWidth = e.clientX - resizableRef.current.getBoundingClientRect().left;
        
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth);
          onWidthChange?.(newWidth);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, onWidthChange]);

  return (
    <div
      ref={resizableRef}
      className={cn("relative flex-none", className)}
      style={{ width: `${width}px` }}
      {...props}
    >
      {children}
      <div
        className={cn(
          "absolute top-0 right-0 bottom-0 w-1 cursor-ew-resize",
          "hover:bg-border/80 active:bg-border",
          isResizing && "bg-border"
        )}
        onMouseDown={() => setIsResizing(true)}
      />
    </div>
  );
}
