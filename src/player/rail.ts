import type { PlayerState, InputState } from '../types';
import type { RoadGraph } from '../map/graph';
import { sampleEdge } from '../map/graph';
import { ACCELERATION, FRICTION, VEHICLES } from '../config';

export interface RailResult {
  x: number;
  z: number;
  angle: number;
  junctionEdges: number[] | null; // non-null when waiting at junction
}

export function updateRail(
  player: PlayerState,
  input: InputState,
  graph: RoadGraph,
  dt: number,
): RailResult {
  const vehicle = VEHICLES[player.vehicleIndex];

  // Accelerate / decelerate
  if (input.forward) {
    player.speed = Math.min(player.speed + ACCELERATION, vehicle.maxSpeed);
  } else {
    player.speed *= FRICTION;
    if (player.speed < 0.001) player.speed = 0;
  }

  // Advance along edge
  const edge = graph.edges[player.currentEdge];
  if (!edge) {
    return { x: 0, z: 0, angle: 0, junctionEdges: null };
  }

  player.progress += (player.speed * dt * 60 / edge.len) * player.direction;
  player.totalDistance += player.speed * dt * 60;

  let junctionEdges: number[] | null = null;

  // Check edge boundaries
  if (player.progress > 1 || player.progress < 0) {
    const atEnd = player.progress > 1;
    player.progress = atEnd ? 1 : 0;

    const nodeIdx = atEnd ? edge.to : edge.from;
    const node = graph.nodes[nodeIdx];

    // Find connected edges (exclude current)
    const connected = node.edges.filter(ei => ei !== player.currentEdge);

    if (connected.length === 0) {
      // Dead end — reverse
      player.direction = (player.direction === 1 ? -1 : 1) as 1 | -1;
    } else if (connected.length === 1) {
      // Auto-continue
      transitionToEdge(player, graph, connected[0], nodeIdx);
    } else {
      // Junction — pause and wait for player choice
      player.speed = 0;
      junctionEdges = connected;
    }
  }

  const pos = sampleEdge(edge, Math.max(0, Math.min(1, player.progress)));
  const dirAngle = player.direction === 1 ? pos.angle : pos.angle + Math.PI;

  return { x: pos.x, z: pos.z, angle: dirAngle, junctionEdges };
}

export function transitionToEdge(
  player: PlayerState,
  graph: RoadGraph,
  edgeIdx: number,
  fromNodeIdx: number,
): void {
  const newEdge = graph.edges[edgeIdx];
  player.currentEdge = edgeIdx;

  // Determine direction based on which end we're entering from
  if (newEdge.from === fromNodeIdx) {
    player.progress = 0;
    player.direction = 1;
  } else {
    player.progress = 1;
    player.direction = -1;
  }
}

/** Choose the junction edge closest to "straight ahead" */
export function chooseStraightest(
  graph: RoadGraph,
  _currentEdge: number,
  nodeIdx: number,
  candidates: number[],
  currentAngle: number,
): number {
  let bestIdx = candidates[0];
  let bestDot = -Infinity;

  const forwardX = Math.sin(currentAngle);
  const forwardZ = Math.cos(currentAngle);

  for (const ei of candidates) {
    const e = graph.edges[ei];
    // Get direction away from the junction node
    let dx: number, dz: number;
    if (e.from === nodeIdx) {
      dx = e.pts[1].x - e.pts[0].x;
      dz = e.pts[1].z - e.pts[0].z;
    } else {
      const last = e.pts.length - 1;
      dx = e.pts[last - 1].x - e.pts[last].x;
      dz = e.pts[last - 1].z - e.pts[last].z;
    }
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const dot = (dx / len) * forwardX + (dz / len) * forwardZ;

    if (dot > bestDot) {
      bestDot = dot;
      bestIdx = ei;
    }
  }

  return bestIdx;
}
