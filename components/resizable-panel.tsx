import * as React from "react"
import { cn } from "@/lib/utils"

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  minWidth?: number
  maxWidth?: number
  defaultWidth?: number
  onWidthChange?: (width: number) => void
  onResizeStart?: () => void
  onResizeEnd?: () => void
}

export function ResizablePanel({
  minWidth = 280,
  maxWidth = 600,
  defaultWidth = 320,
  onWidthChange,
  onResizeStart,
  onResizeEnd,
  className,
  children,
  ...props
}: ResizablePanelProps) {
  const [isResizing, setIsResizing] = React.useState(false)
  const resizeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizeRef.current) return

      let newWidth = e.clientX
      newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      
      resizeRef.current.style.width = `${newWidth}px`
      onWidthChange?.(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      onResizeEnd?.()
    }

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing, minWidth, maxWidth, onWidthChange, onResizeEnd])

  return (
    <div
      ref={resizeRef}
      className={cn(
        "relative flex h-full",
        isResizing && "select-none",
        className
      )}
      style={{ width: defaultWidth }}
      {...props}
    >
      {children}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-1 cursor-col-resize",
          "hover:bg-border active:bg-border",
          isResizing && "bg-border"
        )}
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing(true)
          onResizeStart?.()
        }}
      />
    </div>
  )
}
