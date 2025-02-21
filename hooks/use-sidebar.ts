import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface SidebarState {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

export const useSidebar = create<SidebarState>((set) => ({
  isOpen: true,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}))
