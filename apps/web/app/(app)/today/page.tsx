"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/store/auth";
import { client } from "@/lib/api/client";
import type { Task, Note } from "@/lib/api/client";
import CountUp from "@/components/CountUp";
import GlareHover from "@/components/GlareHover";
import DecryptedText from "@/components/DecryptedText";
import BlurText from "@/components/BlurText";
import ShapeGrid from "@/components/ShapeGrid";
import Magnet from "@/components/Magnet";
import Link from "next/link";

export default function TodayPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState({ tasksDone: 0, tasksTotal: 0, goalsCompleted: 0, streak: 0 });

  useEffect(() => {
    if (!user) return;
    client.listTasks(user.id).then(setTasks);
    client.listNotes(user.id).then(setNotes);
    client.getActivityStats(user.id).then(setStats);
  }, [user]);

  const toggleTask = async (task: Task) => {
    const newStatus = task.status === "done" ? "todo" : "done";
    const updated = await client.updateTask(task.id, { status: newStatus });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (user) client.getActivityStats(user.id).then(setStats);
  };

  const deleteTask = async (taskId: string) => {
    await client.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (user) client.getActivityStats(user.id).then(setStats);
  };

  if (!user) return null;

  const pendingTasks = tasks.filter((t) => t.status !== "done");
  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="relative min-h-full">
      {/* ShapeGrid background — Catppuccin Mocha */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.35]">
        <ShapeGrid
          borderColor="#45475a"
          hoverFillColor="#cba6f7"
          squareSize={56}
          speed={0.2}
          shape="hexagon"
        />
      </div>
      {/* Glow overlay — cool mauve/blue/lavender radial */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-mauve/10 blur-[120px]" />
        <div className="absolute top-1/3 -right-1/4 h-[500px] w-[500px] rounded-full bg-blue/10 blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-lavender/8 blur-[100px]" />
      </div>

      <div className="p-6 space-y-6 max-w-5xl">
        <header className="space-y-1">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-overlay1">
            <span className="dot dot-mauve" />
            <span>{today}</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            <BlurText
              text={`Hola, ${user.name.split(" ")[0]}`}
              delay={30}
              className="text-3xl font-bold"
              animateBy="words"
            />
          </h1>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "hechas", value: stats.tasksDone, color: "dot-success", mauve: false },
            { label: "pendientes", value: stats.tasksTotal - stats.tasksDone, color: "dot-warning", mauve: false },
            { label: "metas ok", value: stats.goalsCompleted, color: "dot-mauve", mauve: true },
            { label: "racha", value: stats.streak, suffix: "d", color: "dot-info", mauve: false },
          ].map((stat) => (
            <GlareHover
              key={stat.label}
              width="100%"
              height="100%"
              background="transparent"
              borderColor="transparent"
              borderRadius="0.75rem"
              glareColor="#cba6f7"
              className="glass-card p-4 flex flex-col items-center justify-center overflow-hidden min-h-[120px]"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`dot ${stat.color}`} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-overlay1">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-bold font-mono ${stat.mauve ? "text-mauve" : "text-foreground"}`}>
                  <CountUp from={0} to={stat.value} duration={1.2} />
                </span>
                {stat.suffix && <span className="text-xs text-overlay1 font-mono">{stat.suffix}</span>}
              </div>
            </GlareHover>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-wider text-overlay1">
                <span className="dot dot-warning mr-2 inline-block" />
                <DecryptedText text="pendientes" animateOn="view" speed={60} className="text-overlay1" />
              </h2>
              <span className="font-mono text-[10px] text-overlay2">{pendingTasks.length}</span>
            </div>
            <div className="space-y-1.5">
              {pendingTasks.length === 0 && (
                <p className="font-mono text-xs text-overlay2 py-4 text-center">// todo despejado</p>
              )}
              {pendingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg glass-chip hover:bg-mauve/10 hover:border-mauve/30 transition-all duration-150 group"
                >
                  <button onClick={() => toggleTask(task)} className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 ${task.status === "in_progress" ? "border-warning bg-warning/20" : "border-overlay1"} items-center justify-center group-hover:border-mauve transition-colors flex`}>
                      {task.status === "in_progress" && <span className="dot dot-warning" />}
                    </span>
                    <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                    <span className={`badge-soft ${task.status === "in_progress" ? "badge-warning" : "badge-muted"}`}>
                      {task.status === "in_progress" ? "wip" : "todo"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded text-overlay2 hover:text-red hover:bg-red/10 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-xs uppercase tracking-wider text-overlay1">
                <span className="dot dot-mauve mr-2 inline-block" />
                <DecryptedText text="notas recientes" animateOn="view" speed={60} className="text-overlay1" />
              </h2>
              <span className="font-mono text-[10px] text-overlay2">{notes.length}</span>
            </div>
            <div className="space-y-1.5">
              {notes.slice(0, 4).map((note) => (
                <Magnet key={note.id} padding={20} magnetStrength={4} disabled={true}>
                  <Link
                    href={`/note/${note.id}`}
                    className="block px-3 py-2 rounded-lg glass-chip hover:bg-mauve/10 hover:border-mauve/30 transition-all duration-150"
                  >
                    <h3 className="text-sm text-foreground truncate">{note.title}</h3>
                    <p className="text-[10px] font-mono text-overlay1 mt-0.5">
                      {new Date(note.updated_at).toLocaleDateString("es-ES")} · {note.tags.length} tags
                    </p>
                  </Link>
                </Magnet>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}