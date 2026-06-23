"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import MarkdownIt from "markdown-it";
import { useAuth } from "@/store/auth";
import { client } from "@/lib/api/client";
import type { GraphData, Note } from "@/lib/api/client";
import { forceSimulation, forceCenter, forceLink, forceManyBody, forceCollide } from "d3-force";
import type { SimulationNodeDatum } from "d3-force";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true, breaks: true });

interface SimNode extends SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
}

interface SimEdge {
  source: string;
  target: string;
  label?: string;
}

const NODE_COLORS: Record<string, string> = {
  note: "#cba6f7",
  goal: "#89b4fa",
  tag: "#f5c2e7",
  user: "#f9e2af",
};

export default function KnowledgePage() {
  const { user } = useAuth();
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [preview, setPreview] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const simRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;
    client.getGraph(user.id).then(setGraph);
    client.listNotes(user.id).then(setNotes);
  }, [user]);

  useEffect(() => {
    if (!graph || graph.nodes.length === 0) return;
    const width = svgRef.current?.clientWidth ?? 400;
    const height = svgRef.current?.clientHeight ?? 500;
    const cx = width / 2;
    const cy = height / 2;
    const nodes: SimNode[] = graph.nodes.map((n) => ({
      id: n.id,
      label: n.label,
      type: n.type,
      x: cx + (Math.random() - 0.5) * 150,
      y: cy + (Math.random() - 0.5) * 150,
    }));

    // Defensive edge filter — only keep edges where BOTH endpoints exist as nodes
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges: SimEdge[] = (graph.edges ?? [])
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({ source: e.source, target: e.target, label: e.label }));

    simRef.current?.stop();
    let sim;
    try {
      sim = forceSimulation<SimNode>(nodes)
        .force("center", forceCenter(cx, cy))
        .force("link", forceLink<SimNode, SimEdge>(edges).distance(80).strength(0.4))
        .force("charge", forceManyBody().strength(-250))
        .force("collide", forceCollide(35))
        .alphaMin(0.01)
        .on("tick", () => setSimNodes([...nodes]));
    } catch {
      // Fallback: no link force if d3 throws on stale references
      sim = forceSimulation<SimNode>(nodes)
        .force("center", forceCenter(cx, cy))
        .force("charge", forceManyBody().strength(-250))
        .force("collide", forceCollide(35))
        .alphaMin(0.01)
        .on("tick", () => setSimNodes([...nodes]));
    }
    simRef.current = sim;
    setSimNodes([...nodes]);
    return () => { sim.stop(); };
  }, [graph]);

  const nodeById = useMemo(() => {
    const map = new Map<string, SimNode>();
    for (const n of simNodes) map.set(n.id, n);
    return map;
  }, [simNodes]);

  const degreeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of graph?.edges ?? []) {
      map.set(e.source, (map.get(e.source) ?? 0) + 1);
      map.set(e.target, (map.get(e.target) ?? 0) + 1);
    }
    return map;
  }, [graph]);

  const renderedEdges = useMemo(() => {
    return (graph?.edges ?? [])
      .map((e) => {
        const src = nodeById.get(e.source);
        const tgt = nodeById.get(e.target);
        return src && tgt ? { x1: src.x ?? 0, y1: src.y ?? 0, x2: tgt.x ?? 0, y2: tgt.y ?? 0, key: e.source + "-" + e.target } : null;
      })
      .filter(Boolean) as Array<{ x1: number; y1: number; x2: number; y2: number; key: string }>;
  }, [graph, nodeById]);

  const renderedMarkdown = useMemo(() => {
    if (!editContent) return "";
    const html = md.render(editContent);
    return html.replace(
      /\[\[([^\]]+)\]\]/g,
      '<span class="wikilink" data-title="$1" contenteditable="false">[[$1]]</span>',
    );
  }, [editContent]);

  const openNote = useCallback(async (id: string) => {
    const note = await client.getNote(id);
    if (note) {
      setSelectedNote(note);
      setEditTitle(note.title);
      setEditContent(note.content);
      setEditTags(note.tags.join(", "));
      setDirty(false);
      setPreview(false);
    }
  }, []);

  const openNoteByTitle = useCallback(
    async (title: string) => {
      const found = notes.find((n) => n.title.toLowerCase() === title.toLowerCase());
      if (found) {
        await openNote(found.id);
      }
    },
    [notes, openNote],
  );

  const createNote = useCallback(async () => {
    if (!user) return;
    const note = await client.createNote(user.id, { title: "Nota sin título", content: "" });
    setNotes((prev) => [note, ...prev]);
    if (graph) {
      setGraph({
        nodes: [...graph.nodes, { id: note.id, label: note.title, type: "note" as const }],
        edges: graph.edges,
      });
    }
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags("");
    setDirty(false);
    setPreview(false);
  }, [user, graph]);

  const saveNote = useCallback(async () => {
    if (!selectedNote || !user) return;
    setSaving(true);
    const tags = editTags.split(",").map((t) => t.trim()).filter(Boolean);
    const updated = await client.updateNote(selectedNote.id, { title: editTitle, content: editContent, tags });
    setSelectedNote(updated);
    setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    // Re-fetch graph so wikilink edges sync after save
    const freshGraph = await client.getGraph(user.id);
    setGraph(freshGraph);
    setDirty(false);
    setSaving(false);
  }, [selectedNote, editTitle, editContent, editTags, graph, user]);

  const deleteNote = useCallback(async () => {
    if (!selectedNote) return;
    if (!confirm(`¿Eliminar "${selectedNote.title}"?`)) return;
    await client.deleteNote(selectedNote.id);
    setNotes((prev) => prev.filter((n) => n.id !== selectedNote.id));
    if (graph) {
      setGraph({
        nodes: graph.nodes.filter((n) => n.id !== selectedNote.id),
        edges: graph.edges.filter((e) => e.source !== selectedNote.id && e.target !== selectedNote.id),
      });
    }
    setSelectedNote(null);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    setDirty(false);
  }, [selectedNote, graph]);

  const handleGraphPointerDown = useCallback(
    (nodeId: string, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDraggingId(nodeId);
      const node = simNodes.find((n) => n.id === nodeId);
      if (node) {
        node.fx = node.x;
        node.fy = node.y;
        simRef.current?.alpha(0.3).restart();
      }
    },
    [simNodes],
  );

  const handleGraphPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingId || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const node = simNodes.find((n) => n.id === draggingId);
      if (node) {
        node.fx = e.clientX - rect.left;
        node.fy = e.clientY - rect.top;
      }
    },
    [draggingId, simNodes],
  );

  const handleGraphPointerUp = useCallback(() => {
    if (!draggingId) return;
    const node = simNodes.find((n) => n.id === draggingId);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    setDraggingId(null);
  }, [draggingId, simNodes]);

  const handlePreviewClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains("wikilink")) {
        const title = target.dataset.title;
        if (title) openNoteByTitle(title);
      }
    },
    [openNoteByTitle],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty) saveNote();
      }
    },
    [dirty, saveNote],
  );

  if (!user) return null;

  const filteredNotes = searchQuery
    ? notes.filter((n) =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : notes;

  return (
    <div className="relative h-full flex flex-col" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="p-4 pb-2 flex items-center gap-3 flex-wrap shrink-0">
        <div className="flex items-center gap-2">
          <span className="dot dot-mauve" />
          <h1 className="text-xl font-bold text-foreground">Grafo</h1>
          <span className="font-mono text-[10px] text-overlay2">{notes.length} notas</span>
        </div>
        <div className="flex-1" />
        <input
          type="text"
          placeholder="buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="glass-input rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-overlay2 w-48"
        />
        <button
          onClick={createNote}
          className="rounded-lg bg-gradient-to-r from-mauve to-lavender px-3 py-1.5 text-sm font-semibold text-crust hover:opacity-90 transition-opacity"
        >
          + nueva
        </button>
      </div>

      {/* 3-pane layout */}
      <div className="flex-1 flex gap-3 px-4 pb-4 min-h-0">
        {/* Left: Note list (file explorer) */}
        <div className="w-52 shrink-0 glass-card rounded-xl flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b border-white/5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-overlay1">
              {filteredNotes.length} archivos
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                onClick={() => openNote(note.id)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md transition-colors ${
                  selectedNote?.id === note.id
                    ? "bg-mauve/15 text-mauve"
                    : "text-overlay1 hover:bg-surface1/60 hover:text-foreground"
                }`}
              >
                <span className="text-sm truncate block">{note.title}</span>
                {note.tags.length > 0 && (
                  <span className="font-mono text-[9px] text-overlay2 block truncate">
                    {note.tags.slice(0, 2).map((t) => `#${t}`).join(" ")}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 glass-card rounded-xl flex flex-col overflow-hidden min-w-0">
          {selectedNote ? (
            <>
              {/* Editor toolbar */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 shrink-0">
                <span className={`font-mono text-[10px] uppercase tracking-wider ${dirty ? "text-peach" : "text-overlay2"}`}>
                  {dirty ? "editando *" : "guardado"}
                </span>
                <div className="flex-1" />
                {/* Edit/Preview toggle */}
                <div className="flex rounded-md bg-surface1/40 p-0.5">
                  <button
                    onClick={() => setPreview(false)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                      !preview ? "bg-mauve/20 text-mauve" : "text-overlay1 hover:text-foreground"
                    }`}
                  >
                    edit
                  </button>
                  <button
                    onClick={() => setPreview(true)}
                    className={`px-2.5 py-1 rounded text-[10px] font-mono transition-colors ${
                      preview ? "bg-mauve/20 text-mauve" : "text-overlay1 hover:text-foreground"
                    }`}
                  >
                    preview
                  </button>
                </div>
                <button
                  onClick={saveNote}
                  disabled={!dirty || saving}
                  className="font-mono text-[10px] px-2.5 py-1 rounded-md bg-mauve/15 border border-mauve/40 text-mauve hover:bg-mauve/25 disabled:opacity-40 transition-colors"
                >
                  {saving ? "⟳" : "⌘S"}
                </button>
                <button
                  onClick={deleteNote}
                  className="font-mono text-[10px] px-2 py-1 rounded-md border border-red/30 text-red/70 hover:bg-red/10 hover:text-red transition-colors"
                >
                  del
                </button>
              </div>

              {/* Editor body */}
              <div className="flex-1 overflow-y-auto p-5">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => { setEditTitle(e.target.value); setDirty(true); }}
                  className="w-full bg-transparent border-0 border-b border-overlay1/40 pb-2 mb-3 text-2xl font-bold text-foreground focus:border-mauve focus:outline-none transition-colors"
                />

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {editTags.split(",").map((t) => t.trim()).filter(Boolean).map((tag, i) => (
                    <span key={i} className="glass-chip px-2 py-0.5 rounded-full text-[10px] font-mono text-mauve">
                      #{tag}
                    </span>
                  ))}
                </div>

                {!preview ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => { setEditContent(e.target.value); setDirty(true); }}
                    placeholder="escribe markdown aquí... usa [[título]] para enlazar notas"
                    className="w-full min-h-[400px] bg-transparent border-0 text-sm text-foreground placeholder:text-overlay2 focus:outline-none resize-none font-mono leading-relaxed"
                  />
                ) : (
                  <div
                    onClick={handlePreviewClick}
                    className="prose prose-invert prose-sm max-w-none text-foreground [&_a]:text-mauve [&_a:no-underline] [&_code]:text-pink [&_code]:bg-surface1/60 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-xs [&_pre]:bg-crust [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-mauve/40 [&_blockquote]:pl-3 [&_blockquote]:text-overlay1 [&_hr]:border-white/10 [&_hr]:my-4 [&_strong]:text-foreground [&_em]:text-foreground [&_table]:w-full [&_th]:text-left [&_th]:font-mono [&_th]:text-xs [&_th]:text-overlay1 [&_th]:border-b [&_th]:border-white/10 [&_th]:pb-1 [&_td]:text-sm [&_td]:border-b [&_td]:border-white/5 [&_td]:py-1"
                    dangerouslySetInnerHTML={{ __html: renderedMarkdown }}
                  />
                )}

                {/* Tags input */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => { setEditTags(e.target.value); setDirty(true); }}
                    placeholder="tags separados por coma..."
                    className="w-full bg-transparent border-0 text-xs text-foreground placeholder:text-overlay2 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="font-mono text-sm text-overlay2">// selecciona una nota del grafo o la lista</p>
                <button
                  onClick={createNote}
                  className="font-mono text-xs text-mauve hover:underline"
                >
                  + crear nueva nota
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Graph */}
        <div className="w-[350px] shrink-0 glass-card rounded-xl overflow-hidden relative">
          {graph && graph.nodes.length > 0 && (
            <div className="absolute top-2 left-2 z-10 flex gap-1.5 font-mono text-[9px]">
              {[
                { type: "note", label: "notas", color: NODE_COLORS.note },
                { type: "goal", label: "metas", color: NODE_COLORS.goal },
              ].map(({ type, label, color }) => (
                <span key={type} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full glass-chip">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </span>
              ))}
            </div>
          )}
          {graph && graph.nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-mono text-xs text-overlay2 text-center px-4">
                // sin nodos —<br />crea notas con [[wikilinks]]
              </p>
            </div>
          )}
          <svg
            ref={svgRef}
            className="w-full h-full block"
            onPointerMove={handleGraphPointerMove}
            onPointerUp={handleGraphPointerUp}
            onPointerLeave={handleGraphPointerUp}
          >
            {renderedEdges.map((e) => (
              <line key={e.key} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke="#45475a" strokeWidth={1.5} strokeOpacity={0.5} />
            ))}
            {simNodes.map((node) => {
              const color = NODE_COLORS[node.type] ?? "#6c6f85";
              const degree = degreeMap.get(node.id) ?? 0;
              const radius = node.type === "goal" ? 12 : 8 + Math.min(degree * 2, 6);
              const isSelected = selectedNote?.id === node.id;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x},${node.y})`}
                  onPointerDown={(e) => handleGraphPointerDown(node.id, e)}
                  onClick={(e) => { e.stopPropagation(); openNote(node.id); }}
                  style={{ cursor: draggingId === node.id ? "grabbing" : "pointer" }}
                >
                  {isSelected && (
                    <circle r={radius + 5} fill="none" stroke={color} strokeWidth={1.5} strokeOpacity={0.4} />
                  )}
                  <circle r={radius} fill={color} fillOpacity={isSelected ? 0.5 : 0.25} stroke={color} strokeWidth={2} />
                  <text
                    textAnchor="middle"
                    dy={radius + 12}
                    className="select-none font-mono pointer-events-none"
                    fill={isSelected ? "#cdd6f4" : "#a6adc8"}
                    fontSize={8}
                  >
                    {node.label.length > 14 ? node.label.slice(0, 13) + "…" : node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}