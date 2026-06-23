"use client";

import { useState } from "react";
import { useAuth } from "@/store/auth";
import ShapeGrid from "@/components/ShapeGrid";
import FadeContent from "@/components/FadeContent";
import ClickSpark from "@/components/ClickSpark";

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [saved, setSaved] = useState(false);
  const [notif, setNotif] = useState(true);
  const [dark, setDark] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="relative min-h-full">
      <div className="absolute inset-0 -z-10 opacity-30">
        <ShapeGrid shape="hexagon" speed={0.4} borderColor="#313244" hoverFillColor="#cba6f7" />
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <FadeContent blur>
          <header className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-overlay1">
              <span className="dot dot-mauve" />
              <span>settings</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          </header>
        </FadeContent>

        <FadeContent blur className="space-y-4">
          <section className="glass-card rounded-xl p-5 space-y-4">
            <div className="font-mono text-xs uppercase tracking-wider text-overlay1 border-b border-border/40 pb-2">
              preferencias
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-foreground flex items-center gap-2">
                  <span className="dot dot-success" />
                  Notificaciones
                </span>
                <button
                  onClick={() => setNotif(!notif)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${notif ? "bg-mauve" : "bg-surface2"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all duration-200 ${notif ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </label>
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm text-foreground flex items-center gap-2">
                  <span className="dot dot-info" />
                  Tema oscuro
                </span>
                <button
                  onClick={() => setDark(!dark)}
                  className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${dark ? "bg-mauve" : "bg-surface2"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-all duration-200 ${dark ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </label>
            </div>

            <div className="pt-2">
              <ClickSpark sparkColor="#cba6f7" sparkCount={10}>
                <button
                  onClick={handleSave}
                  className="font-mono px-4 py-2 rounded-md bg-mauve/15 border border-mauve/40 text-mauve hover:bg-mauve/25 transition-colors duration-150 text-sm"
                >
                  {saved ? "✓ guardado" : "guardar cambios"}
                </button>
              </ClickSpark>
            </div>
          </section>

          <section className="glass-card rounded-xl p-5 space-y-3">
            <div className="font-mono text-xs uppercase tracking-wider text-overlay1 border-b border-border/40 pb-2">
              sesión
            </div>
            <p className="text-sm text-foreground">
              Has iniciado sesión como <span className="font-mono text-mauve">{user.email}</span>
            </p>
            <button
              onClick={() => { if (confirm("¿Cerrar sesión?")) logout(); }}
              className="font-mono px-3 py-1.5 rounded-md border border-red/40 text-red hover:bg-red/10 transition-colors text-xs"
            >
              cerrar sesión
            </button>
          </section>

          <section className="glass-card rounded-xl p-5 font-mono text-xs text-overlay1 space-y-1">
            <div className="text-overlay2 uppercase tracking-wider mb-2">build</div>
            <div>version · 1.0.0</div>
            <div>api · mock-first</div>
            <div>theme · catppuccin-mocha</div>
          </section>
        </FadeContent>
      </div>
    </div>
  );
}