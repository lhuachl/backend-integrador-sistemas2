import React, { useMemo, useCallback } from 'react';
import { StyleSheet, useWindowDimensions, Pressable, View } from 'react-native';
import Svg, { G, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useForceGraph, type GraphNode, type GraphEdge } from '@/hooks/useForceGraph';
import { catppuccin } from '@/theme/catppuccin';

export interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodePress?: (id: string) => void;
}

const COLORS: Record<string, string> = {
  note: catppuccin.mocha.lavender,
  goal: catppuccin.mocha.green,
  tag: catppuccin.mocha.peach,
  user: catppuccin.mocha.sky,
};

const HIT_RADIUS = 30;

function hitTest(
  x: number,
  y: number,
  positions: Array<{ id: string; x: number; y: number; label: string; type?: string }>,
): string | null {
  let closest: string | null = null;
  let closestDist = HIT_RADIUS;
  for (const p of positions) {
    const dx = p.x - x;
    const dy = p.y - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < closestDist) {
      closestDist = dist;
      closest = p.id;
    }
  }
  return closest;
}

export function GraphView({ nodes, edges, onNodePress }: GraphViewProps) {
  const { width, height } = useWindowDimensions();
  const svgHeight = height - 200;
  const { positions } = useForceGraph(nodes, edges, width, svgHeight);

  const degreeMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of edges) {
      map.set(e.source, (map.get(e.source) ?? 0) + 1);
      map.set(e.target, (map.get(e.target) ?? 0) + 1);
    }
    return map;
  }, [edges]);

  const handlePress = useCallback(
    (event: any) => {
      const { locationX, locationY } = event.nativeEvent;
      const id = hitTest(locationX, locationY, positions);
      if (id) {
        Haptics.selectionAsync();
        onNodePress?.(id);
      }
    },
    [positions, onNodePress],
  );

  if (positions.length === 0) {
    return null;
  }

  return (
    <Pressable onPress={handlePress} style={[styles.container, { width, height: svgHeight }]}>
      <Svg width={width} height={svgHeight} style={styles.svg}>
        {edges.map((e, i) => {
          const s = positions.find((p) => p.id === e.source);
          const t = positions.find((p) => p.id === e.target);
          if (!s || !t) return null;
          return (
            <Line
              key={i}
              x1={s.x}
              y1={s.y}
              x2={t.x}
              y2={t.y}
              stroke={catppuccin.mocha.surface1}
              strokeWidth={1.5}
            />
          );
        })}
        {positions.map((node) => {
          const color = COLORS[node.type ?? 'note'] ?? catppuccin.mocha.lavender;
          const degree = degreeMap.get(node.id) ?? 0;
          const radius = 16 + Math.min(degree * 3, 12);
          const labelWidth = node.label.length * 5.5 + 12;

          return (
            <G key={node.id}>
              <Circle cx={node.x} cy={node.y} r={radius} fill={color} opacity={0.9} />
              <Circle cx={node.x} cy={node.y} r={radius + 3} fill="none" stroke={color} strokeWidth={1} opacity={0.3} />
              <Rect
                x={node.x - labelWidth / 2}
                y={node.y + radius + 4}
                width={labelWidth}
                height={16}
                rx={4}
                fill={catppuccin.mocha.crust}
                opacity={0.8}
              />
              <SvgText
                x={node.x}
                y={node.y + radius + 15}
                fontSize={9}
                fill={catppuccin.mocha.subtext1}
                fontFamily="JetBrainsMono"
                textAnchor="middle"
              >
                {node.label.length > 18 ? node.label.slice(0, 17) + '\u2026' : node.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {},
  svg: {
    backgroundColor: 'transparent',
  },
});
