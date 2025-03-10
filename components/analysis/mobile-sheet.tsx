"use client"

import * as React from "react"
import { Sheet } from "react-modal-sheet"
import { VideoContent } from "@/components/analysis/video-content"
import { useAnalysis } from "@/hooks/use-analysis-context"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileSheetProps {
  isOpen: boolean
  onClose: () => void
  loading?: boolean
  error?: string | null
}

export function MobileSheet({ isOpen, onClose, loading, error }: MobileSheetProps) {
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = React.useState<number | null>(null)
  const [snapPoints, setSnapPoints] = React.useState([0.95, 0.65])
  const { videoData } = useAnalysis()

  React.useEffect(() => {
    if (!contentRef.current) return

    const updateSnapPoints = () => {
      if (!contentRef.current) return

      const viewportHeight = window.innerHeight
      const contentHeight = contentRef.current.scrollHeight
      const contentRatio = contentHeight / viewportHeight

      if (contentRatio < 0.3) {
        setSnapPoints([contentRatio + 0.05, contentRatio + 0.05])
      } else if (contentRatio < 0.5) {
        setSnapPoints([contentRatio + 0.1, contentRatio + 0.05])
      } else if (contentRatio < 0.7) {
        setSnapPoints([0.75, contentRatio + 0.05])
      } else {
        setSnapPoints([0.95, 0.65])
      }

      setContentHeight(contentHeight)
    }

    updateSnapPoints()

    const resizeObserver = new ResizeObserver(() => {
      updateSnapPoints()
    })

    resizeObserver.observe(contentRef.current)
    window.addEventListener('resize', updateSnapPoints)

    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current)
      }
      window.removeEventListener('resize', updateSnapPoints)
    }
  }, [contentRef, videoData])

  const isPlaylist = videoData?.type === "playlist"
  const contentTitle = videoData ?
    (isPlaylist ? "Playlist" : "Video") :
    "Content"

  return (
    <div className="block sm:hidden">
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        snapPoints={snapPoints}
        initialSnap={1}
        tweenConfig={{
          ease: [0.36, 0, 0.66, 1],
          duration: 0.3
        }}
        style={{
          "--rsbs-bg": "hsl(var(--background))",
          "--rsbs-handle-bg": "hsla(var(--muted-foreground) / 0.2)",
          "--rsbs-max-w": "640px",
          "--rsbs-overlay-h": "0px",
          "--rsbs-ml": "env(safe-area-inset-left)",
          "--rsbs-mr": "env(safe-area-inset-right)",
          "--rsbs-antigap": "0px",
          "--rsbs-backdrop-bg": "rgba(0, 0, 0, 0.1)",
          "--rsbs-backdrop-filter": "blur(1px)"
        } as any}
      >
        <Sheet.Container
          className="border border-border"
          style={{
            boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.05)",
            borderTopLeftRadius: "16px",
            borderTopRightRadius: "16px",
            background: "hsl(var(--background))",
            maxHeight: "calc(100vh - 64px)",
          }}
        >
          <Sheet.Header className="pt-2 relative">
            <div className="h-1.5 w-12 rounded-full mx-auto mb-4 bg-muted-foreground/20" />
            <div className="flex items-center justify-between px-4 mb-1">
              <p className="text-sm font-medium">{contentTitle}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full hover:bg-muted/80"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </Sheet.Header>
          <Sheet.Content>
            <Sheet.Scroller
              className="hover:scrollbar scrollbar-thin"
              style={{
                scrollbarWidth: "thin",
              }}
            >
              <style jsx global>{`
                .react-modal-sheet-content::-webkit-scrollbar {
                  width: 8px !important;
                  height: 8px !important;
                }
                .react-modal-sheet-content::-webkit-scrollbar-track {
                  background: transparent !important;
                }
                .react-modal-sheet-content::-webkit-scrollbar-thumb {
                  background-color: hsla(var(--muted-foreground) / 0.2) !important;
                  border-radius: 20px !important;
                  border: none !important;
                }
                .react-modal-sheet-content::-webkit-scrollbar-thumb:hover {
                  background-color: hsla(var(--muted-foreground) / 0.3) !important;
                }
              `}</style>
              <div className="px-6 pb-6" ref={contentRef}>
                <VideoContent loading={loading} error={error} />
              </div>
            </Sheet.Scroller>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={onClose} />
      </Sheet>
    </div>
  )
}
