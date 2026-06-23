"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import { useRouter } from "next/navigation";
import { client } from "@/lib/api/client";
import type { Team } from "@/lib/api/client";
import ScrollReveal from "@/components/ScrollReveal";
import DecryptedText from "@/components/DecryptedText";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [stats, setStats] = useState({ notes: 0, goals: 0, streak: 0, tasksDone: 0 });

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editHandle, setEditHandle] = useState(user?.handle ?? "");
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatar_url ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    client.listTeams(user.id).then(setTeams);
    client.listNotes(user.id).then((n) => setStats((s) => ({ ...s, notes: n.length })));
    client.listGoals(user.id).then((g) => setStats((s) => ({ ...s, goals: g.length })));
    client.getActivityStats(user.id).then((a) =>
      setStats((s) => ({ ...s, streak: a.streak, tasksDone: a.tasksDone })),
    );
  }, [user]);

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditHandle(user.handle ?? "");
      setEditAvatarUrl(user.avatar_url ?? "");
    }
  }, [user]);

  const saveProfile = async () => {
    if (!user || !editName.trim()) return;
    setSaving(true);
    const updated = await client.updateProfile(user.id, {
      name: editName.trim(),
      handle: editHandle.trim() || undefined,
      avatar_url: editAvatarUrl.trim() || undefined,
    });
    useAuth.setState({ user: updated });
    setEditing(false);
    setSaving(false);
  };

  const cancelEdit = () => {
    setEditName(user?.name ?? "");
    setEditHandle(user?.handle ?? "");
    setEditAvatarUrl(user?.avatar_url ?? "");
    setEditing(false);
  };

  if (!user) return null;

  const initial = (user.name || "?")[0].toUpperCase();
  const avatarSrc = editing ? editAvatarUrl : user.avatar_url;

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-[600px] w-[600px] rounded-full bg-mauve/6 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-blue/5 blur-[120px]" />
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-overlay1">
              <span className="dot dot-mauve" />
              <span>profile</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              <DecryptedText text="Perfil" animateOn="view" speed={50} />
            </h1>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="rounded-lg font-mono text-[10px] px-3 py-1.5 border border-overlay1/30 text-overlay1 hover:border-mauve/40 hover:text-mauve transition-colors"
          >
            {editing ? "cancelar" : "editar"}
          </button>
        </header>

        {/* Credential card with CSS lanyard */}
        <ScrollReveal>
          <div className="relative pt-10 pb-2 flex justify-center">
            {/* Lanyard lines */}
            <svg
              className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none overflow-visible"
              width="120"
              height="52"
              viewBox="0 0 120 52"
              fill="none"
            >
              {/* Left strap */}
              <path d="M60 0 C30 0 15 20 15 40 C15 48 22 52 30 52" stroke="#45475a" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Right strap */}
              <path d="M60 0 C90 0 105 20 105 40 C105 48 98 52 90 52" stroke="#45475a" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Metal clip */}
              <rect x="48" y="48" width="24" height="6" rx="3" fill="#585b70" />
              <circle cx="60" cy="51" r="2" fill="#313244" />
            </svg>

            {/* Credential card */}
            <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-surface0/90 p-6 shadow-2xl backdrop-blur-md overflow-hidden">
              {/* Card glow overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-mauve/5 via-transparent to-blue/5 pointer-events-none" />

              <div className="relative space-y-4">
                {/* Avatar section */}
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover border-2 border-mauve/30 shadow-lg shadow-mauve/10"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-mauve/15 border-2 border-mauve/30 flex items-center justify-center shadow-lg shadow-mauve/10">
                        <span className="font-mono text-2xl font-bold text-mauve">{initial}</span>
                      </div>
                    )}
                    {/* Camera badge on avatar (mobile parity) */}
                    {editing && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-lavender flex items-center justify-center border-2 border-base shadow-md">
                        <svg className="w-3.5 h-3.5 text-crust" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
                    {user.handle && (
                      <p className="font-mono text-xs text-overlay1 mt-0.5">@{user.handle}</p>
                    )}
                    <p className="text-xs text-overlay2 mt-0.5 font-mono">{user.email}</p>
                  </div>
                </div>

                {/* Role + Member since */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className={`badge-soft font-mono ${
                    user.role === "admin" ? "badge-mauve" :
                    user.role === "mentor" ? "badge-warning" :
                    "badge-info"
                  }`}>
                    {user.role}
                  </span>
                  <span className="font-mono text-[10px] text-overlay2">
                    miembro desde {new Date(user.created_at).toLocaleDateString("es-ES", { year: "numeric", month: "short" })}
                  </span>
                </div>

                {/* ID bar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 font-mono text-[9px] text-overlay2">
                  <span>ID: {user.id.slice(0, 12)}...</span>
                  <span className="text-mauve font-semibold tracking-wider">FLOW-STATE</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Edit panel */}
        {editing && (
          <ScrollReveal>
            <div className="glass-card rounded-xl p-5 border-l-2 border-mauve/40 space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-overlay1">editar perfil</h3>
              <input
                type="url"
                placeholder="URL de foto de perfil"
                value={editAvatarUrl}
                onChange={(e) => setEditAvatarUrl(e.target.value)}
                className="glass-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-overlay2 w-full"
              />
              <input
                type="text"
                placeholder="Nombre"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-overlay1/40 pb-2 text-lg font-bold text-foreground placeholder:text-overlay2 focus:border-mauve focus:outline-none transition-colors"
              />
              <input
                type="text"
                placeholder="@handle"
                value={editHandle}
                onChange={(e) => setEditHandle(e.target.value)}
                className="w-full bg-transparent border-0 border-b border-overlay1/40 pb-2 text-sm text-foreground placeholder:text-overlay2 focus:border-mauve focus:outline-none transition-colors font-mono"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="rounded-lg bg-gradient-to-r from-mauve to-lavender px-4 py-2 text-sm font-semibold text-crust hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {saving ? "guardando..." : "guardar"}
                </button>
                <button onClick={cancelEdit} className="font-mono text-xs text-overlay1 hover:text-foreground transition-colors px-3 py-2">
                  cancelar
                </button>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Stats */}
        <ScrollReveal>
          <div className="glass-card rounded-xl p-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "notas", value: stats.notes, color: "text-mauve" },
                { label: "metas", value: stats.goals, color: "text-green" },
                { label: "días racha", value: stats.streak, color: "text-warning" },
                { label: "tareas hechas", value: stats.tasksDone, color: "text-sapphire" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <span className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</span>
                  <p className="font-mono text-[10px] text-overlay1 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Teams */}
        {teams.length > 0 && (
          <ScrollReveal>
            <section className="glass-card rounded-xl p-5 space-y-3">
              <h3 className="font-mono text-xs uppercase tracking-wider text-overlay1">
                <span className="dot dot-success mr-2 inline-block" />
                equipos · {teams.length}
              </h3>
              <div className="flex flex-wrap gap-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => router.push("/team")}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg glass-chip hover:bg-mauve/10 hover:border-mauve/30 transition-all"
                  >
                    <div className="w-6 h-6 rounded bg-mauve/15 border border-mauve/30 flex items-center justify-center font-mono text-[10px] font-bold text-mauve">
                      {team.name[0]}
                    </div>
                    <span className="text-sm text-foreground">{team.name}</span>
                    <span className="font-mono text-[10px] text-overlay2">@{team.slug}</span>
                  </button>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Logout */}
        <ScrollReveal>
          <button
            onClick={() => { if (confirm("¿Cerrar sesión?")) logout(); }}
            className="w-full rounded-xl border border-red/30 bg-red/5 py-2.5 font-mono text-sm text-red hover:bg-red/10 hover:border-red/50 transition-colors"
          >
            cerrar sesión
          </button>
        </ScrollReveal>
      </div>
    </div>
  );
}