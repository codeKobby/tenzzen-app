"use client"

import * as React from "react"
import { Sheet } from "react-modal-sheet"
import { VideoContent } from "./video-content"
import { useAnalysis } from "@/hooks/use-analysis-context"

interface MobileSheetProps {
  isOpen: boolean
  onClose: () => void
  loading?: boolean
  error?: string | null
}

export function MobileSheet({ isOpen, onClose, loading, error }: MobileSheetProps) {
  return (
    <div className="block sm:hidden">
      <Sheet
        isOpen={isOpen}
        onClose={onClose}
        snapPoints={[0.95, 0.65]}
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
          <Sheet.Header className="pt-2">
            <div className="h-1.5 w-12 rounded-full mx-auto mb-4 bg-muted-foreground/20" />
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
              <div className="px-6 pb-6">
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
