"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/store/auth";
import { useSidebar } from "@/store/sidebar";
import { Icon } from "@/components/Icon";
import { client } from "@/lib/api/client";
import type { Note, Goal } from "@/lib/api/client";

export function SidePanel() {
  const { user } = useAuth();
  const { open, toggle } = useSidebar();
  const pathname = usePathname();
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (!user) return;
    client.listNotes(user.id).then((n) => setRecentNotes(n.slice(0, 6)));
    client.listGoals(user.id).then(setGoals);
  }, [user]);

  if (!open) return null;

  const headers: Record<string, string> = {
    today: "Hoy",
    knowledge: "Grafo",
    progression: "Metas",
    team: "Equipo",
    profile: "Perfil",
    settings: "Configuración",
  };

  const tab = Object.keys(headers).find((k) => pathname.includes(k));
  const title = tab ? headers[tab] : "Flow-state";

  return (
    <aside className="w-56 xl:w-64 shrink-0 glass-panel border-r border-sidebar-border p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-overlay1">{title}</h2>
        <button
          onClick={toggle}
          className="p-1 rounded hover:bg-surface1 text-overlay1 hover:text-foreground transition-colors"
          title="Colapsar panel (⌘B)"
        >
          <Icon name="chevronLeft" size={14} />
        </button>
      </div>

      <div className="space-y-5">
        {tab === "today" && (
          <>
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-wider text-overlay2 mb-2">Hoy</h3>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-overlay1">
                  <span className="dot dot-mauve" />
                  <span className="font-mono">5 pendientes</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-overlay1">
                  <span className="dot dot-success" />
                  <span className="font-mono">3 hechas</span>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "knowledge" && (
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-overlay2 mb-2">Recientes</h3>
            <div className="space-y-1">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/note/${note.id}`}
                  className="block text-xs text-overlay1 hover:text-foreground truncate py-0.5 font-mono"
                >
                  → {note.title}
                </Link>
              ))}
              {recentNotes.length === 0 && (
                <p className="text-xs text-overlay2 font-mono">Sin notas aún</p>
              )}
            </div>
          </div>
        )}

        {tab === "progression" && (
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-overlay2 mb-2">Metas activas</h3>
            <div className="space-y-2">
              {goals.map((goal) => {
                const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
                return (
                  <div key={goal.id}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-overlay1 truncate flex-1">{goal.title}</span>
                      <span className="font-mono text-mauve ml-2">{pct}%</span>
                    </div>
                    <div className="mt-1 h-0.5 bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full bg-mauve rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              {goals.length === 0 && (
                <p className="text-xs text-overlay2 font-mono">Sin metas</p>
              )}
            </div>
          </div>
        )}

        {tab === "team" && (
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-overlay2 mb-2">Equipos</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="dot dot-success" />
                <span className="text-overlay1 font-mono">Equipo Demo</span>
              </div>
            </div>
          </div>
        )}

        {tab === "profile" && user && (
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-overlay2">rol</span>
              <span className="text-overlay1">{user.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-overlay2">handle</span>
              <span className="text-overlay1">@{user.handle ?? "—"}</span>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="font-mono text-xs text-overlay1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="dot dot-mauve" />
              <span>tema oscuro</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="dot dot-success" />
              <span>notificaciones on</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}