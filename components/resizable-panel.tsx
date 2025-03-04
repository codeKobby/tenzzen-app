"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  onWidthChange?: (width: number) => void
}

export function ResizablePanel({
  defaultWidth = 400,
  minWidth = 320,
  maxWidth = 500,
  onWidthChange,
  className,
  children,
  ...props
}: ResizablePanelProps) {
  const [width, setWidth] = React.useState(defaultWidth)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  const handlePointerDown = React.useCallback((e: React.PointerEvent) => {
    if (!panelRef.current) return
    setIsDragging(true)

    const startX = e.clientX
    const startWidth = panelRef.current.offsetWidth

    const onPointerMove = (e: PointerEvent) => {
      if (!panelRef.current) return

      const newWidth = startWidth + e.clientX - startX
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))

      setWidth(clampedWidth)
      if (onWidthChange) {
        onWidthChange(clampedWidth)
      }
    }

    const onPointerUp = () => {
      setIsDragging(false)
      document.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerup', onPointerUp)
    }

    document.addEventListener('pointermove', onPointerMove)
    document.addEventListener('pointerup', onPointerUp)
  }, [minWidth, maxWidth, onWidthChange])

  React.useEffect(() => {
    if (defaultWidth !== width) {
      setWidth(defaultWidth)
    }
  }, [defaultWidth, width])

  return (
    <div
      ref={panelRef}
      className={cn("relative", className)}
      style={{ width: `${width}px` }}
      {...props}
    >
      {children}
      <div
        className={cn(
          "absolute top-0 right-0 h-full w-[6px] cursor-ew-resize opacity-0 transition-opacity hover:opacity-100 hover:bg-border",
          isDragging && "opacity-100 bg-primary/20"
        )}
        onPointerDown={handlePointerDown}
      />
    </div>
  )
}
