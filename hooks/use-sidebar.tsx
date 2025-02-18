"use client"

import { create } from "zustand"
import { createJSONStorage, persist, devtools } from "zustand/middleware"
import { StateCreator } from "zustand"

interface SidebarState {
  isOpen: boolean
  isCollapsed: boolean
}

interface SidebarActions {
  toggle: () => void
}

type SidebarStore = SidebarState & SidebarActions

const createSidebarStore: StateCreator<
  SidebarStore,
  [["zustand/devtools", never], ["zustand/persist", unknown]]
> = (set) => ({
  isOpen: false,
  isCollapsed: false,
  toggle: () =>
    set(
      (state) => ({
        isOpen: !state.isOpen,
        isCollapsed: !state.isCollapsed,
      }),
      false,
      "toggle"
    ),
})

export const useSidebar = create<SidebarStore>()(
  devtools(
    persist(createSidebarStore, {
      name: "sidebar-storage",
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined") {
          return localStorage
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),
    })
  )
)
