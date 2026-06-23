"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

const items = [
  { name: "today", href: "/today", label: "Hoy", icon: "home", shortcut: "1" },
  { name: "knowledge", href: "/knowledge", label: "Grafo", icon: "brain", shortcut: "2" },
  { name: "progression", href: "/progression", label: "Metas", icon: "target", shortcut: "3" },
  { name: "team", href: "/team", label: "Equipo", icon: "users", shortcut: "4" },
  { name: "profile", href: "/profile", label: "Perfil", icon: "user", shortcut: "5" },
];

export function ActivityBar() {
  const pathname = usePathname();

  return (
    <nav className="w-14 shrink-0 flex flex-col items-center gap-1 py-3 glass-panel border-r border-sidebar-border">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`group relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200
              ${active
                ? "bg-mauve/20 text-mauve shadow-[0_0_20px_-8px_oklch(0.86_0.14_305/0.6)]"
                : "text-overlay1 hover:text-foreground hover:bg-surface1"
              }`}
            title={`${item.label} (${item.shortcut})`}
          >
            <Icon name={item.icon} size={20} />
            {active && (
              <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-mauve shadow-[0_0_8px_oklch(0.86_0.14_305/0.8)]" />
            )}
            <span className="absolute left-full ml-2 px-2 py-0.5 rounded-md bg-surface1 border border-border text-xs font-mono whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
              <span className="text-mauve">{item.shortcut}</span> <span className="text-overlay1">{item.label}</span>
            </span>
          </Link>
        );
      })}
      <div className="mt-auto" />
      <Link
        href="/settings"
        className={`group relative w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200
          ${pathname.startsWith("/settings")
            ? "bg-mauve/20 text-mauve shadow-[0_0_20px_-8px_oklch(0.86_0.14_305/0.6)]"
            : "text-overlay1 hover:text-foreground hover:bg-surface1"
          }`}
        title="Configuración"
      >
        <Icon name="settings" size={20} />
        {pathname.startsWith("/settings") && (
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-mauve shadow-[0_0_8px_oklch(0.86_0.14_305/0.8)]" />
        )}
      </Link>
    </nav>
  );
}