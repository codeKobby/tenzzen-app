"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ResizablePanelProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onResize'> {
  defaultSize: number;
  minSize?: number;
  maxSize?: number;
  onResize?: (size: number) => void;
}

export function ResizablePanel({
  defaultSize,
  minSize = 0,
  maxSize = Infinity,
  onResize,
  className,
  children,
  ...props
}: ResizablePanelProps) {
  const [size, setSize] = React.useState(defaultSize);
  const [isResizing, setIsResizing] = React.useState(false);
  const resizeRef = React.useRef<HTMLDivElement>(null);
  const startXRef = React.useRef<number>(0);
  const startWidthRef = React.useRef<number>(0);

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const dx = e.clientX - startXRef.current;
      const newSize = Math.max(minSize, Math.min(maxSize, startWidthRef.current + dx));
      
      setSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, maxSize, minSize, onResize]);

  const startResizing = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = size;
  }, [size]);

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size }}
      {...props}
    >
      <div
        ref={resizeRef}
        className={cn(
          "absolute -left-1 top-0 h-full w-2 cursor-col-resize select-none",
          isResizing && "bg-primary/10"
        )}
        onMouseDown={startResizing}
      />
      {children}
    </div>
  );
}