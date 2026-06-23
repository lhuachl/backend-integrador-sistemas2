import { useEffect, useRef, useState, useCallback } from 'react';
import { forceSimulation, forceLink, forceManyBody, forceCenter, type Simulation } from 'd3-force';

export interface GraphNode {
  id: string;
  label: string;
  type?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface PositionedNode {
  id: string;
  label: string;
  type?: string;
  x: number;
  y: number;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface SimEdge {
  source: SimNode;
  target: SimNode;
}

export function useForceGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
) {
  const [positions, setPositions] = useState<PositionedNode[]>([]);
  const simRef = useRef<Simulation<SimNode, SimEdge> | null>(null);

  const stop = useCallback(() => {
    simRef.current?.stop();
    simRef.current = null;
  }, []);

  useEffect(() => {
    if (nodes.length === 0 || width === 0 || height === 0) {
      setPositions([]);
      return;
    }

    stop();

    const simNodes: SimNode[] = nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const r = Math.min(width, height) * 0.25;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 20,
        y: height / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
      };
    });

    const nodeMap = new Map(simNodes.map((n) => [n.id, n]));
    const simEdges: SimEdge[] = edges
      .map((e) => {
        const s = nodeMap.get(typeof e.source === 'string' ? e.source : (e.source as SimNode).id);
        const t = nodeMap.get(typeof e.target === 'string' ? e.target : (e.target as SimNode).id);
        return s && t ? { source: s, target: t } : null;
      })
      .filter((e): e is SimEdge => e !== null);

    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimEdge>(simEdges)
          .id((d) => d.id)
          .distance(80)
          .strength(0.4),
      )
      .force('charge', forceManyBody().strength(-200))
      .force('center', forceCenter(width / 2, height / 2))
      .alphaDecay(0.03);

    simulation.on('tick', () => {
      setPositions(
        simNodes.map((n) => ({
          id: n.id,
          label: n.label,
          type: n.type,
          x: n.x,
          y: n.y,
        })),
      );
    });

    simRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height, stop]);

  return { positions, stop };
}
