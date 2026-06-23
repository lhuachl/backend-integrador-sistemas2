import { create } from "zustand";

interface SidebarState {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
}

export const useSidebar = create<SidebarState>((set) => ({
  open: true,
  toggle: () => set((s) => ({ open: !s.open })),
  setOpen: (open) => set({ open }),
}));

const KEY = "flowstate_sidebar_open";

try {
  const saved = localStorage.getItem(KEY);
  if (saved !== null) {
    useSidebar.setState({ open: saved === "1" });
  }
} catch {}

useSidebar.subscribe((state) => {
  try { localStorage.setItem(KEY, state.open ? "1" : "0"); } catch {}
});
