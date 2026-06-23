"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import { client } from "@/lib/api/client";
import type { Team } from "@/lib/api/client";
import ShapeGrid from "@/components/ShapeGrid";
import GlareHover from "@/components/GlareHover";
import DecryptedText from "@/components/DecryptedText";
import ScrollFloat from "@/components/ScrollFloat";

type MemberData = { id: string; name: string; email: string; role: string };

export default function TeamPage() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [members, setMembers] = useState<Record<string, MemberData[]>>({});
  const [error, setError] = useState<string | null>(null);

  // Create team form
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Invite form
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "mentor">("member");

  useEffect(() => {
    if (!user) return;
    client.listTeams(user.id).then(setTeams);
  }, [user]);

  useEffect(() => {
    for (const t of teams) {
      client.listTeamMembers(t.id).then((m) =>
        setMembers((prev) => ({ ...prev, [t.id]: m })),
      );
    }
  }, [teams]);

  const submitCreate = async () => {
    if (!user || !teamName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      await client.createTeam(user.id, { name: teamName.trim(), description: teamDesc.trim() || undefined });
      const fresh = await client.listTeams(user.id);
      setTeams(fresh);
      setTeamName("");
      setTeamDesc("");
      setShowCreate(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error creando equipo");
    }
    setCreating(false);
  };

  const submitInvite = async () => {
    if (!inviteTeamId || !inviteEmail.trim()) return;
    setError(null);
    try {
      await client.inviteMember(inviteTeamId, { email: inviteEmail.trim(), role: inviteRole });
      const fresh = await client.listTeamMembers(inviteTeamId);
      setMembers((prev) => ({ ...prev, [inviteTeamId]: fresh }));
      setInviteEmail("");
      setInviteTeamId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error invitando miembro");
    }
  };

  if (!user) return null;

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.2]">
        <ShapeGrid shape="square" speed={0.3} borderColor="#45475a" hoverFillColor="#cba6f7" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-mauve/6 blur-[120px]" />
      </div>

      <div className="p-6 space-y-5 max-w-4xl">
        {/* Header */}
        <header className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-overlay1">
              <span className="dot dot-success" />
              <span>teams</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              <DecryptedText text="Equipo" animateOn="view" speed={50} />
            </h1>
            <p className="font-mono text-xs text-overlay1">{teams.length} equipos</p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="rounded-lg bg-gradient-to-r from-mauve to-lavender px-3 py-1.5 text-sm font-semibold text-crust hover:opacity-90 transition-opacity"
          >
            + Crear
          </button>
        </header>

        {error && (
          <div className="rounded-md border border-red/30 bg-red/10 px-3 py-2 font-mono text-xs text-red">
            {error}
          </div>
        )}

        {/* Create team form */}
        {showCreate && (
          <ScrollFloat>
            <div className="glass-card rounded-xl p-5 border-l-2 border-mauve/40">
              <h3 className="font-mono text-xs uppercase tracking-wider text-overlay1 mb-3">nuevo equipo</h3>
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                <input type="text" placeholder="nombre del equipo" value={teamName} onChange={(e) => setTeamName(e.target.value)}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-overlay2 flex-1" />
                <input type="text" placeholder="descripción (opcional)" value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-overlay2 flex-1" />
              </div>
              <div className="flex gap-2">
                <button onClick={submitCreate} disabled={creating}
                  className="rounded-lg bg-gradient-to-r from-mauve to-lavender px-4 py-2 text-sm font-semibold text-crust hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {creating ? "creando..." : "crear equipo"}
                </button>
                <button onClick={() => setShowCreate(false)}
                  className="font-mono text-xs text-overlay1 hover:text-foreground transition-colors px-3 py-2">cancelar</button>
              </div>
            </div>
          </ScrollFloat>
        )}

        {/* Teams */}
        {teams.length === 0 && (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="font-mono text-xs text-overlay2">
              // no perteneces a ningún equipo — crea uno o pedí que te inviten
            </p>
          </div>
        )}

        <div className="space-y-4">
          {teams.map((team) => {
            const teamMembers = members[team.id] ?? [];
            return (
              <GlareHover key={team.id} width="100%" height="100%" background="transparent"
                borderColor="transparent" borderRadius="0.75rem" className="glass-card overflow-hidden">
                <div className="p-5">
                  {/* Team header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-mauve/15 border border-mauve/30 flex items-center justify-center font-mono text-base font-bold text-mauve">
                        {team.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-foreground">{team.name}</h3>
                        <p className="font-mono text-[10px] text-overlay1">@{team.slug}</p>
                      </div>
                    </div>
                    <span className={`badge-soft font-mono ${
                      team.owner_id === user.id ? "badge-mauve" : teamMembers.some((m) => m.role === "mentor") ? "badge-info" : "badge-muted"
                    }`}>
                      {team.owner_id === user.id ? "owner" : teamMembers.find((m) => m.email === user.email)?.role ?? "member"}
                    </span>
                  </div>

                  {team.description && (
                    <p className="text-sm text-overlay1 mb-3">{team.description}</p>
                  )}

                  {/* Members */}
                  <div className="border-t border-white/5 pt-3">
                    <h4 className="font-mono text-[10px] uppercase tracking-wider text-overlay1 mb-2">
                      miembros · {teamMembers.length}
                    </h4>
                    {teamMembers.length === 0 ? (
                      <p className="font-mono text-[10px] text-overlay2 py-2">// sin miembros</p>
                    ) : (
                      <div className="space-y-1.5 mb-3">
                        {teamMembers.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-surface1/40 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-mauve/15 border border-mauve/30 flex items-center justify-center font-mono text-xs font-semibold text-mauve shrink-0">
                              {m.name[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{m.name}</p>
                              <p className="font-mono text-[10px] text-overlay1 truncate">{m.email}</p>
                            </div>
                            <span className={`shrink-0 font-mono text-[10px] px-2 py-0.5 rounded-full ${
                              m.role === "owner" ? "bg-mauve/15 text-mauve" :
                              m.role === "mentor" ? "bg-info/15 text-sapphire" :
                              "bg-surface1/60 text-overlay1"
                            }`}>
                              {m.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Invite toggle */}
                    {inviteTeamId === team.id ? (
                      <div className="pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <input type="email" placeholder="email@miembro.com" value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)} autoFocus
                            className="glass-input rounded-lg px-3 py-1.5 text-xs text-foreground placeholder:text-overlay2 flex-1 min-w-[180px]" />
                          <div className="flex gap-1">
                            <button onClick={() => setInviteRole("member")}
                              className={`font-mono text-[10px] px-2 py-1 rounded-md border transition-colors ${
                                inviteRole === "member" ? "bg-mauve/20 border-mauve/40 text-mauve" : "border-overlay1/20 text-overlay1"
                              }`}>
                              miembro
                            </button>
                            <button onClick={() => setInviteRole("mentor")}
                              className={`font-mono text-[10px] px-2 py-1 rounded-md border transition-colors ${
                                inviteRole === "mentor" ? "bg-mauve/20 border-mauve/40 text-mauve" : "border-overlay1/20 text-overlay1"
                              }`}>
                              mentor
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={submitInvite} disabled={!inviteEmail.trim()}
                            className="font-mono text-[10px] px-3 py-1 rounded-md bg-mauve/15 border border-mauve/40 text-mauve hover:bg-mauve/25 disabled:opacity-40 transition-colors">
                            invitar
                          </button>
                          <button onClick={() => { setInviteTeamId(null); setInviteEmail(""); }}
                            className="font-mono text-[10px] text-overlay1 hover:text-foreground transition-colors px-2 py-1">
                            cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setInviteTeamId(team.id)}
                        className="font-mono text-[10px] text-overlay2 hover:text-mauve transition-colors px-2 py-1 rounded hover:bg-surface1/40">
                        + invitar miembro
                      </button>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5 mt-3 font-mono text-[10px] text-overlay2">
                    <span className="dot dot-success" />
                    <span>activo</span>
                    <span className="opacity-40">·</span>
                    <span>creado {new Date(team.created_at).toLocaleDateString("es-ES")}</span>
                  </div>
                </div>
              </GlareHover>
            );
          })}
        </div>
      </div>
    </div>
  );
}