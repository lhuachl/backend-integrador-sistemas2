"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/auth";
import { useSidebar } from "@/store/sidebar";

export function StatusLine() {
  const { user } = useAuth();
  const { toggle } = useSidebar();
  const pathname = usePathname();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  const tabName = pathname === "/" ? "welcome" : pathname.split("/")[1] ?? "home";

  return (
    <footer className="h-7 shrink-0 flex items-center gap-3 px-3 glass-panel border-t border-sidebar-border font-mono text-[10px] uppercase tracking-wider text-overlay1">
      <button
        onClick={toggle}
        className="hover:text-mauve transition-colors"
        title="Toggle SidePanel (⌘B)"
      >
        [PANEL]
      </button>
      <span className="opacity-40">·</span>
      <span className="text-mauve">[{tabName}]</span>
      <span className="opacity-40">·</span>
      <span>@{user?.handle ?? "guest"}</span>
      <div className="flex-1" />
      <span className="dot dot-success" />
      <span>online</span>
      <span className="opacity-40">·</span>
      <span>{time}</span>
    </footer>
  );
}