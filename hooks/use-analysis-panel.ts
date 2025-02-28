import { create } from "zustand"

interface AnalysisPanelState {
  width: number
  minWidth: number
  maxWidth: number
  isOpen: boolean
  setWidth: (width: number) => void
  toggle: () => void
}

export const useAnalysisPanel = create<AnalysisPanelState>((set) => ({
  width: 320,
  minWidth: 280,
  maxWidth: 480, // Approximately 40% of a 1200px wide screen
  isOpen: true,
  setWidth: (width) => set({ width }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))
