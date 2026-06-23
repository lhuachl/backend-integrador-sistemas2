"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/store/auth";
import { client } from "@/lib/api/client";
import type { Goal, Task as TaskType, ActivityStats } from "@/lib/api/client";
import SpotlightCard from "@/components/SpotlightCard";
import CountUp from "@/components/CountUp";
import ScrollFloat from "@/components/ScrollFloat";
import DecryptedText from "@/components/DecryptedText";
import ShapeGrid from "@/components/ShapeGrid";

const WEEK_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

type TaskFilter = "all" | "todo" | "done";

export default function ProgressionPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [week, setWeek] = useState<Array<{ date: string; active: boolean }>>([]);

  // Create goal
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalUnit, setGoalUnit] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [creating, setCreating] = useState(false);

  // Create task
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskGoalId, setTaskGoalId] = useState<string | null>(null);

  // Filter
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");

  useEffect(() => {
    if (!user) return;
    client.listGoals(user.id).then(setGoals);
    client.listTasks(user.id).then(setTasks);
    client.getActivityStats(user.id).then(setStats);
    client.getWeekActivity().then(setWeek);
  }, [user]);

  const addProgress = async (goalId: string, amount: number) => {
    const updated = await client.addProgress(goalId, amount);
    setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    if (user) client.getActivityStats(user.id).then(setStats);
  };

  const toggleTask = async (task: TaskType) => {
    const newStatus = task.status === "done" ? "todo" : task.status === "in_progress" ? "done" : "in_progress";
    const updated = await client.updateTask(task.id, { status: newStatus });
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    if (user) client.getActivityStats(user.id).then(setStats);
  };

  const deleteTask = async (taskId: string) => {
    await client.deleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (user) client.getActivityStats(user.id).then(setStats);
  };

  const submitGoal = async () => {
    if (!user || !goalTitle || !goalTarget || !goalUnit) return;
    setCreating(true);
    await client.createGoal(user.id, {
      title: goalTitle,
      target: Number(goalTarget),
      unit: goalUnit,
      description: goalDesc || undefined,
    });
    const fresh = await client.listGoals(user.id);
    setGoals(fresh);
    setGoalTitle("");
    setGoalTarget("");
    setGoalUnit("");
    setGoalDesc("");
    setShowCreateGoal(false);
    setCreating(false);
    if (user) client.getActivityStats(user.id).then(setStats);
  };

  const submitTask = async () => {
    if (!user || !taskTitle.trim()) return;
    await client.createTask(user.id, { title: taskTitle.trim(), goal_id: taskGoalId });
    const fresh = await client.listTasks(user.id);
    setTasks(fresh);
    setTaskTitle("");
    setTaskGoalId(null);
    setShowCreateTask(false);
    if (user) client.getActivityStats(user.id).then(setStats);
  };

  const filteredTasks = tasks.filter((t) => {
    if (taskFilter === "todo") return t.status !== "done";
    if (taskFilter === "done") return t.status === "done";
    return true;
  });

  if (!user) return null;

  return (
    <div className="relative min-h-full">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden opacity-[0.2]">
        <ShapeGrid borderColor="#45475a" hoverFillColor="#89b4fa" squareSize={48} speed={0.3} shape="circle" />
      </div>
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-1/4 right-0 h-[500px] w-[500px] rounded-full bg-sapphire/8 blur-[120px]" />
        <div className="absolute bottom-0 -left-1/4 h-[500px] w-[500px] rounded-full bg-mauve/6 blur-[120px]" />
      </div>

      <div className="p-6 space-y-5 max-w-6xl">
        {/* Header */}
        <header className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-overlay1">
              <span className="dot dot-info" />
              <span>progression</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              <DecryptedText text="Progresión" animateOn="view" speed={50} />
            </h1>
          </div>
          <button
            onClick={() => setShowCreateGoal(!showCreateGoal)}
            className="rounded-lg bg-gradient-to-r from-mauve to-lavender px-3 py-1.5 text-sm font-semibold text-crust hover:opacity-90 transition-opacity"
          >
            + Meta
          </button>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats && [
            { label: "racha", value: stats.streak, suffix: "d", color: "dot-warning" },
            { label: "hechas", value: stats.tasksDone, color: "dot-success" },
            { label: "pendientes", value: stats.tasksTotal - stats.tasksDone, color: "dot-warning" },
            { label: "metas ok", value: stats.goalsCompleted, color: "dot-mauve" },
          ].map((s) => (
            <div key={s.label} className="glass-card rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px]">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`dot ${s.color}`} />
                <span className="font-mono text-[10px] uppercase tracking-wider text-overlay1">{s.label}</span>
              </div>
              <span className={`text-3xl font-bold font-mono ${s.label === "metas ok" ? "text-mauve" : "text-foreground"}`}>
                <CountUp from={0} to={s.value} duration={1} />
              </span>
              {s.suffix && <span className="text-xs text-overlay1 font-mono ml-0.5">{s.suffix}</span>}
            </div>
          ))}
        </div>

        {/* Week heatmap */}
        {week.length > 0 && (
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-mono text-[10px] uppercase tracking-wider text-overlay1 mb-3">esta semana</h3>
            <div className="flex justify-between gap-1">
              {week.map((day, i) => {
                const isToday = i === week.length - 1;
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1.5 flex-1">
                    <span className="font-mono text-[10px] text-overlay1">{WEEK_LABELS[i]}</span>
                    <div
                      className={`w-full min-h-[36px] rounded-md transition-colors ${
                        day.active ? (isToday ? "bg-mauve/60 ring-1 ring-mauve/80" : "bg-mauve/40") : "bg-surface1/60"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create goal form */}
        {showCreateGoal && (
          <ScrollFloat>
            <div className="glass-card rounded-xl p-5 border-l-2 border-mauve/40">
              <h3 className="font-mono text-xs uppercase tracking-wider text-overlay1 mb-3">nueva meta</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input type="text" placeholder="título" value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-overlay2" />
                <input type="number" placeholder="objetivo (ej: 10)" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-overlay2" />
                <input type="text" placeholder="unidad (ej: papers)" value={goalUnit} onChange={(e) => setGoalUnit(e.target.value)}
                  className="glass-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-overlay2" />
              </div>
              <input type="text" placeholder="descripción (opcional)" value={goalDesc} onChange={(e) => setGoalDesc(e.target.value)}
                className="glass-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-overlay2 w-full mb-3" />
              <div className="flex gap-2">
                <button onClick={submitGoal} disabled={creating}
                  className="rounded-lg bg-gradient-to-r from-mauve to-lavender px-4 py-2 text-sm font-semibold text-crust hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {creating ? "creando..." : "crear meta"}
                </button>
                <button onClick={() => setShowCreateGoal(false)}
                  className="font-mono text-xs text-overlay1 hover:text-foreground transition-colors px-3 py-2">
                  cancelar
                </button>
              </div>
            </div>
          </ScrollFloat>
        )}

        {/* Goals */}
        <section>
          <h2 className="font-mono text-xs uppercase tracking-wider text-overlay1 mb-3">
            <span className="dot dot-info mr-2 inline-block" />Metas · {goals.length}
          </h2>
          {goals.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <p className="font-mono text-xs text-overlay2">// sin metas — crea una para empezar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {goals.map((goal) => {
                const pct = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
                const done = goal.current >= goal.target;
                const goalTasks = tasks.filter((t) => t.goal_id === goal.id);
                const tasksDone = goalTasks.filter((t) => t.status === "done").length;
                return (
                  <SpotlightCard key={goal.id} spotlightColor="rgba(203, 166, 247, 0.2)"
                    className="glass-card rounded-xl p-5 overflow-hidden">
                    <ScrollFloat>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base font-semibold truncate ${done ? "text-green" : "text-foreground"}`}>
                            {done && "✓ "}{goal.title}
                          </h3>
                          {goal.description && <p className="text-xs text-overlay1 mt-0.5">{goal.description}</p>}
                        </div>
                        <div className="flex items-baseline gap-1 ml-3">
                          <span className={`text-2xl font-bold font-mono ${done ? "text-green" : "text-mauve"}`}>
                            <CountUp from={0} to={pct} duration={1.2} />
                          </span>
                          <span className="font-mono text-xs text-overlay1">%</span>
                        </div>
                      </div>

                      <div className="relative h-2 bg-surface2/60 rounded-full overflow-hidden mb-3">
                        <div className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                          done ? "bg-gradient-to-r from-green to-teal" : "bg-gradient-to-r from-mauve to-lavender"
                        }`} style={{ width: `${pct}%` }} />
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-mono text-xs text-overlay1">
                          <span className="text-foreground font-semibold">{goal.current}</span>
                          <span className="text-overlay2"> / </span>
                          <span className="text-foreground font-semibold">{goal.target}</span>
                          <span className="text-overlay2 ml-1">{goal.unit}</span>
                          {goalTasks.length > 0 && (
                            <>
                              <span className="text-overlay2 mx-1">·</span>
                              <span>{tasksDone}/{goalTasks.length} tareas</span>
                            </>
                          )}
                        </span>
                        {!done && (
                          <div className="flex gap-1.5">
                            {[1, 5, 10].map((amt) => (
                              <button key={amt} onClick={() => addProgress(goal.id, amt)}
                                className="font-mono px-2 py-0.5 text-[10px] rounded-md border border-border bg-surface1/60 hover:bg-mauve/20 hover:border-mauve/40 text-overlay1 hover:text-mauve transition-colors">
                                +{amt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {goalTasks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                          {goalTasks.map((task) => (
                            <div key={task.id}
                              className="flex items-center gap-2 px-2 py-1 rounded hover:bg-surface1/40 transition-colors group">
                              <button onClick={() => toggleTask(task)} className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                                  task.status === "done" ? "bg-green/30 border-green/50" :
                                  task.status === "in_progress" ? "bg-warning/30 border-warning/50" :
                                  "border-overlay1"
                                }`}>
                                  {task.status === "done" && <span className="text-[8px] text-green">✓</span>}
                                  {task.status === "in_progress" && <span className="w-1.5 h-1.5 rounded-sm bg-warning" />}
                                </span>
                                <span className={`text-xs flex-1 truncate ${task.status === "done" ? "line-through text-overlay2" : "text-foreground"}`}>
                                  {task.title}
                                </span>
                                <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-full ${
                                  task.status === "done" ? "bg-green/15 text-green" :
                                  task.status === "in_progress" ? "bg-warning/15 text-warning" :
                                  "bg-surface1/60 text-overlay1"
                                }`}>
                                  {task.status === "done" ? "done" : task.status === "in_progress" ? "wip" : "todo"}
                                </span>
                              </button>
                              <button onClick={() => deleteTask(task.id)}
                                className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-overlay2 hover:text-red hover:bg-red/10 transition-colors opacity-0 group-hover:opacity-100">
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                  <path d="M10 11v6M14 11v6" />
                                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Quick-add task to goal */}
                      <button onClick={() => { setTaskGoalId(goal.id); setShowCreateTask(true); setTaskTitle(""); }}
                        className="mt-2 font-mono text-[10px] text-overlay2 hover:text-mauve transition-colors">
                        + añadir tarea
                      </button>
                    </ScrollFloat>
                  </SpotlightCard>
                );
              })}
            </div>
          )}
        </section>

        {/* Tasks section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-mono text-xs uppercase tracking-wider text-overlay1">
              <span className="dot dot-warning mr-2 inline-block" />Tareas · {tasks.length}
            </h2>
            <button onClick={() => { setTaskGoalId(null); setShowCreateTask(true); setTaskTitle(""); }}
              className="font-mono text-[10px] text-mauve hover:underline px-2 py-0.5">
              + tarea
            </button>
          </div>

          {/* Create task form */}
          {showCreateTask && (
            <div className="glass-card rounded-xl p-4 mb-3 border-l-2 border-mauve/40 space-y-3">
              <h4 className="font-mono text-[10px] uppercase tracking-wider text-overlay1">nueva tarea</h4>
              <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="título de la tarea" autoFocus
                className="glass-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-overlay2 w-full" />
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setTaskGoalId(null)}
                  className={`font-mono text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                    taskGoalId === null ? "bg-mauve/20 border-mauve/40 text-mauve" : "border-overlay1/30 text-overlay1 hover:border-mauve/30"}`}>
                  sin meta
                </button>
                {goals.map((g) => (
                  <button key={g.id} onClick={() => setTaskGoalId(g.id)}
                    className={`font-mono text-[10px] px-2 py-0.5 rounded-full border transition-colors truncate max-w-[140px] ${
                      taskGoalId === g.id ? "bg-mauve/20 border-mauve/40 text-mauve" : "border-overlay1/30 text-overlay1 hover:border-mauve/30"}`}>
                    {g.title}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={submitTask} disabled={!taskTitle.trim()}
                  className="font-mono text-[10px] px-3 py-1 rounded-md bg-mauve/15 border border-mauve/40 text-mauve hover:bg-mauve/25 disabled:opacity-40 transition-colors">
                  crear
                </button>
                <button onClick={() => setShowCreateTask(false)}
                  className="font-mono text-[10px] text-overlay1 hover:text-foreground transition-colors px-2 py-1">
                  cancelar
                </button>
              </div>
            </div>
          )}

          {/* Filter tabs */}
          <div className="flex gap-1 mb-3">
            {([["all", "Todas"], ["todo", "Pendientes"], ["done", "Hechas"]] as [TaskFilter, string][]).map(([f, label]) => (
              <button key={f} onClick={() => setTaskFilter(f)}
                className={`font-mono text-[10px] px-2.5 py-1 rounded-md border transition-colors ${
                  taskFilter === f ? "bg-mauve/20 border-mauve/40 text-mauve" : "border-overlay1/20 text-overlay1 hover:border-overlay1/40"
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Task list */}
          <div className="glass-card rounded-xl p-4 space-y-1">
            {filteredTasks.length === 0 ? (
              <p className="font-mono text-xs text-overlay2 py-4 text-center">// sin tareas aquí</p>
            ) : (
              filteredTasks.map((task) => {
                const linkedGoal = goals.find((g) => g.id === task.goal_id);
                return (
                  <div key={task.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface1/40 transition-colors group">
                    <button onClick={() => toggleTask(task)} className="flex items-center gap-2 flex-1 min-w-0">
                      <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center transition-colors ${
                        task.status === "done" ? "bg-green/30 border-green/50" :
                        task.status === "in_progress" ? "bg-warning/30 border-warning/50" :
                        "border-overlay1"
                      }`}>
                        {task.status === "done" && <span className="text-[8px] text-green">✓</span>}
                        {task.status === "in_progress" && <span className="w-1.5 h-1.5 rounded-sm bg-warning" />}
                      </span>
                      <span className={`text-xs break-words ${task.status === "done" ? "line-through text-overlay2" : "text-foreground"}`}>
                        {task.title}
                      </span>
                      {linkedGoal && (
                        <span className="shrink-0 font-mono text-[9px] text-overlay2 ml-1 max-w-[80px] truncate">
                          · {linkedGoal.title}
                        </span>
                      )}
                    </button>
                    <span className={`shrink-0 font-mono text-[9px] px-1.5 py-0.5 rounded-full ${
                      task.status === "done" ? "bg-green/15 text-green" :
                      task.status === "in_progress" ? "bg-warning/15 text-warning" :
                      "bg-surface1/60 text-overlay1"
                    }`}>
                      {task.status === "todo" ? "pendiente" : task.status === "in_progress" ? "wip" : "hecha"}
                    </span>
                    <button onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-overlay2 hover:text-red hover:bg-red/10 transition-colors opacity-0 group-hover:opacity-100">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                      </svg>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}