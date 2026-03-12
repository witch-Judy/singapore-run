import type { GraphNode, GraphEdge, RoadData, RoadType, Vec2 } from '../types';
import { NODE_MERGE_RESOLUTION } from '../config';
import { latLngToWorld } from './projection';

export interface RoadGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildGraph(roads: RoadData[]): RoadGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const nodeMap = new Map<string, number>();

  function getOrCreateNode(x: number, z: number): number {
    const kx = Math.round(x / NODE_MERGE_RESOLUTION);
    const kz = Math.round(z / NODE_MERGE_RESOLUTION);
    const key = `${kx},${kz}`;
    const existing = nodeMap.get(key);
    if (existing !== undefined) return existing;
    const idx = nodes.length;
    nodes.push({ x, z, edges: [] });
    nodeMap.set(key, idx);
    return idx;
  }

  for (const road of roads) {
    if (road.points.length < 2) continue;

    const pts: Vec2[] = road.points.map(([lat, lng]) => latLngToWorld(lat, lng));

    const fromIdx = getOrCreateNode(pts[0].x, pts[0].z);
    const toIdx = getOrCreateNode(pts[pts.length - 1].x, pts[pts.length - 1].z);

    // Calculate polyline length
    let len = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dz = pts[i].z - pts[i - 1].z;
      len += Math.sqrt(dx * dx + dz * dz);
    }

    if (len < 0.1) continue; // skip degenerate edges

    const edgeIdx = edges.length;
    edges.push({
      from: fromIdx,
      to: toIdx,
      pts,
      len,
      name: road.name,
      type: road.type as RoadType,
    });

    nodes[fromIdx].edges.push(edgeIdx);
    nodes[toIdx].edges.push(edgeIdx);
  }

  return { nodes, edges };
}

/** Find the edge closest to a given world position */
export function findNearestEdge(graph: RoadGraph, x: number, z: number): { edge: number; progress: number } {
  let bestEdge = 0;
  let bestDist = Infinity;
  let bestProgress = 0;

  for (let ei = 0; ei < graph.edges.length; ei++) {
    const e = graph.edges[ei];
    let traveled = 0;
    for (let i = 1; i < e.pts.length; i++) {
      const ax = e.pts[i - 1].x, az = e.pts[i - 1].z;
      const bx = e.pts[i].x, bz = e.pts[i].z;
      const dx = bx - ax, dz = bz - az;
      const segLen = Math.sqrt(dx * dx + dz * dz);
      if (segLen < 0.001) { traveled += segLen; continue; }

      // Project point onto segment
      let t = ((x - ax) * dx + (z - az) * dz) / (segLen * segLen);
      t = Math.max(0, Math.min(1, t));
      const px = ax + t * dx;
      const pz = az + t * dz;
      const dist = Math.sqrt((x - px) * (x - px) + (z - pz) * (z - pz));

      if (dist < bestDist) {
        bestDist = dist;
        bestEdge = ei;
        bestProgress = (traveled + t * segLen) / e.len;
      }
      traveled += segLen;
    }
  }

  return { edge: bestEdge, progress: bestProgress };
}

/** Sample position along an edge at given progress (0..1) */
export function sampleEdge(edge: GraphEdge, progress: number): Vec2 & { angle: number } {
  const targetDist = progress * edge.len;
  let traveled = 0;

  for (let i = 1; i < edge.pts.length; i++) {
    const ax = edge.pts[i - 1].x, az = edge.pts[i - 1].z;
    const bx = edge.pts[i].x, bz = edge.pts[i].z;
    const dx = bx - ax, dz = bz - az;
    const segLen = Math.sqrt(dx * dx + dz * dz);

    if (traveled + segLen >= targetDist || i === edge.pts.length - 1) {
      const t = segLen > 0.001 ? Math.min((targetDist - traveled) / segLen, 1) : 0;
      return {
        x: ax + t * dx,
        z: az + t * dz,
        angle: Math.atan2(dx, dz),
      };
    }
    traveled += segLen;
  }

  // Fallback
  const last = edge.pts[edge.pts.length - 1];
  return { x: last.x, z: last.z, angle: 0 };
}
