"use client";

import { useAuth } from "@/store/auth";
import { Icon } from "@/components/Icon";

export function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-12 shrink-0 flex items-center gap-3 px-4 glass-panel border-b border-sidebar-border">
      <div className="flex items-center gap-2">
        <span className="dot dot-mauve" />
        <span className="text-sm font-mono font-semibold text-foreground tracking-tight">
          flow-state
        </span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md border border-border bg-surface1/40 font-mono text-xs text-overlay1">
          <Icon name="search" size={12} />
          <span>Buscar</span>
          <span className="ml-2 px-1 py-0.5 rounded bg-surface2 text-overlay2">⌘K</span>
        </div>

        <button
          onClick={() => {
            if (confirm("¿Cerrar sesión?")) logout();
          }}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md text-sm text-overlay1 hover:text-foreground hover:bg-surface1 transition-colors duration-150"
        >
          <div className="w-6 h-6 rounded-full bg-mauve/20 border border-mauve/40 flex items-center justify-center font-mono text-xs font-medium text-mauve">
            {user?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <span className="hidden md:inline font-mono text-xs">{user?.handle ?? user?.email ?? "user"}</span>
        </button>
      </div>
    </header>
  );
}