"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface SidebarState {
  isOpen: boolean
  toggle: () => void
}

export const useSidebar = create<SidebarState>()(
  persist(
    (set) => ({
      isOpen: false,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: "sidebar-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)