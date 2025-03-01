"use client"

import * as React from "react"
import { Sheet } from "react-modal-sheet"
import { VideoContent } from "./video-content"

interface MobileSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileSheet({ isOpen, onClose }: MobileSheetProps) {
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
            <Sheet.Scroller>
              <div className="px-6 pb-6">
                <VideoContent />
              </div>
            </Sheet.Scroller>
          </Sheet.Content>
        </Sheet.Container>
        <Sheet.Backdrop onTap={onClose} />
      </Sheet>
    </div>
  )
}
