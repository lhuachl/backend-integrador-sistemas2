"use client";

import { useEffect } from "react";
import { ActivityBar } from "@/components/shell/ActivityBar";
import { TopBar } from "@/components/shell/TopBar";
import { SidePanel } from "@/components/shell/SidePanel";
import { StatusLine } from "@/components/shell/StatusLine";
import { useSidebar } from "@/store/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { toggle } = useSidebar();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggle]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background relative">
      {/* Ambient glow — subtle mauve/lavender depth, no sepia */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-mauve/5 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue/5 blur-[150px]" />
      </div>
      <TopBar />
      <div className="flex-1 flex overflow-hidden relative z-10">
        <ActivityBar />
        <SidePanel />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <StatusLine />
    </div>
  );
}