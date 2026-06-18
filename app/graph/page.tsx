'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ReactFlow, Background, Controls, MarkerType, type Node, type Edge } from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import '@xyflow/react/dist/style.css'
import { useAuth } from '@/components/auth/auth-provider'
import { AuthPage } from '@/components/auth/auth-page'
import { AppLayout } from '@/components/layout/app-layout'
import { getRituals, type RitualRecord } from '@/lib/services/rituals'
import { getSlotsByDate, type SlotRecord } from '@/lib/services/slots'
import { MODULES, MODULE_MAP, type ModuleId } from '@/lib/constants/modules'
import { format } from 'date-fns'
import { AlertCircle } from 'lucide-react'

const NODE_WIDTH = 180
const NODE_HEIGHT = 56

function layoutNodes(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 })

  nodes.forEach((n) => g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  edges.forEach((e) => g.setEdge(e.source, e.target))

  dagre.layout(g)

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id)
      return { ...n, position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 } }
    }),
    edges,
  }
}

export default function GraphPage() {
  const { user, loading } = useAuth()
  const today = format(new Date(), 'yyyy-MM-dd')
  const [rituals, setRituals] = useState<RitualRecord[]>([])
  const [slots, setSlots] = useState<SlotRecord[]>([])
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [rResult, sResult] = await Promise.all([
      getRituals(),
      getSlotsByDate(today),
    ])
    if (rResult.error) setError(`rituals: ${rResult.error}`)
    else if (sResult.error) setError(`slots: ${sResult.error}`)
    if (rResult.data) setRituals(rResult.data)
    if (sResult.data) setSlots(sResult.data)
    setFetching(false)
  }, [today])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const { nodes, edges } = useMemo(() => {
    const moduleIds: ModuleId[] = MODULES.map((m) => m.id)

    /* Module nodes */
    const moduleNodes: Node[] = moduleIds.map((id) => {
      const m = MODULE_MAP[id]
      const moduleRituals = rituals.filter((r) => r.module === id)
      const moduleSlots = slots.filter((s) => s.module === id)
      return {
        id: `module-${id}`,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className="text-left">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
                <m.icon className="h-4 w-4 text-indigo-400" />
                {m.label}
              </div>
              <div className="text-[10px] text-zinc-500">
                {moduleRituals.length} rituals · {moduleSlots.length} slots
              </div>
            </div>
          ),
        },
        style: {
          background: '#09090b',
          border: '1px solid rgb(63 63 70)',
          borderRadius: '8px',
          width: NODE_WIDTH,
          padding: '8px 12px',
        },
      }
    })

    /* Ritual nodes */
    const ritualNodes: Node[] = rituals.map((r) => {
      const mod = r.module ? MODULE_MAP[r.module as ModuleId] : null
      return {
        id: `ritual-${r.id}`,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className="text-left">
              <div className="truncate text-xs text-zinc-300">{r.title}</div>
              <div className="text-[10px] text-zinc-600">
                {r.streak_count}d streak {mod ? `· ${mod.label}` : ''}
              </div>
            </div>
          ),
        },
        style: {
          background: '#0c0a09',
          border: '1px solid rgb(39 39 42)',
          borderRadius: '6px',
          width: NODE_WIDTH,
          padding: '6px 10px',
        },
      }
    })

    /* Slot nodes (today only) */
    const slotNodes: Node[] = slots.map((s) => {
      const mod = s.module ? MODULE_MAP[s.module as ModuleId] : null
      return {
        id: `slot-${s.id}`,
        type: 'default',
        position: { x: 0, y: 0 },
        data: {
          label: (
            <div className="text-left">
              <div className="truncate text-xs text-zinc-300">{s.title}</div>
              <div className="text-[10px] text-zinc-600">
                {s.status} {mod ? `· ${mod.label}` : ''}
              </div>
            </div>
          ),
        },
        style: {
          background: '#0c0a09',
          border: `1px solid ${
            s.status === 'done' ? 'rgb(16 185 129 / 0.5)' :
            s.status === 'now' ? 'rgb(99 102 241 / 0.7)' :
            s.status === 'not_done' ? 'rgb(239 68 68 / 0.5)' :
            'rgb(39 39 42)'
          }`,
          borderRadius: '6px',
          width: NODE_WIDTH,
          padding: '6px 10px',
        },
      }
    })

    /* Edges: ritual -> module, slot -> module */
    const allEdges: Edge[] = []
    rituals.forEach((r) => {
      if (r.module) {
        allEdges.push({
          id: `r-${r.id}-${r.module}`,
          source: `ritual-${r.id}`,
          target: `module-${r.module}`,
          type: 'straight',
          style: { stroke: 'rgb(99 102 241 / 0.3)', strokeWidth: 1 },
          markerEnd: { type: MarkerType.ArrowClosed, color: 'rgb(99 102 241 / 0.3)' },
        })
      }
    })
    slots.forEach((s) => {
      if (s.module) {
        allEdges.push({
          id: `s-${s.id}-${s.module}`,
          source: `slot-${s.id}`,
          target: `module-${s.module}`,
          type: 'straight',
          style: { stroke: 'rgb(63 63 70)', strokeWidth: 1 },
        })
      }
    })

    return layoutNodes([...moduleNodes, ...ritualNodes, ...slotNodes], allEdges)
  }, [rituals, slots])

  if (loading || !user) {
    if (!user) return <AuthPage />
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="flex h-dvh w-full flex-col">
        <div className="border-b border-zinc-800/30 bg-zinc-950/50 px-8 py-4 backdrop-blur-sm">
          <h1 className="text-lg font-light text-zinc-200">LifeOS graph</h1>
          <p className="text-xs text-zinc-500">
            {MODULES.length} modules · {rituals.length} rituals · {slots.length} slots today
          </p>
        </div>

        {error && (
          <div className="mx-8 mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Error</div>
              <div className="text-red-400/80">{error}</div>
            </div>
            <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-300">×</button>
          </div>
        )}

        <div className="flex-1">
          {fetching ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-6 w-6 animate-pulse rounded-full bg-zinc-800" />
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{ type: 'straight' }}
              style={{ background: 'transparent' }}
            >
              <Background color="rgb(63 63 70 / 0.3)" gap={20} size={1} />
              <Controls className="!bg-zinc-900/80 !border-zinc-800" />
            </ReactFlow>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
