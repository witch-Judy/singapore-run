import * as THREE from 'three';
import type { RoadGraph } from './graph';
import { ROAD_SPECS } from '../config';

export function createRoadMeshes(graph: RoadGraph): THREE.Group {
  const group = new THREE.Group();
  group.name = 'roads';

  // Group edges by type for batching
  const byType = new Map<string, number[]>();
  for (let i = 0; i < graph.edges.length; i++) {
    const t = graph.edges[i].type;
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(i);
  }

  for (const [type, edgeIndices] of byType) {
    const spec = ROAD_SPECS[type] || ROAD_SPECS.residential;

    // Road surface
    const positions: number[] = [];
    const indices: number[] = [];
    let vertOffset = 0;

    for (const ei of edgeIndices) {
      const edge = graph.edges[ei];
      const pts = edge.pts;
      if (pts.length < 2) continue;

      const halfW = spec.width / 2;

      for (let i = 0; i < pts.length; i++) {
        let dx: number, dz: number;
        if (i < pts.length - 1) {
          dx = pts[i + 1].x - pts[i].x;
          dz = pts[i + 1].z - pts[i].z;
        } else {
          dx = pts[i].x - pts[i - 1].x;
          dz = pts[i].z - pts[i - 1].z;
        }
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        const nx = -dz / len;
        const nz = dx / len;

        positions.push(pts[i].x + nx * halfW, 0.01, pts[i].z + nz * halfW);
        positions.push(pts[i].x - nx * halfW, 0.01, pts[i].z - nz * halfW);

        if (i < pts.length - 1) {
          const base = vertOffset + i * 2;
          indices.push(base, base + 1, base + 2);
          indices.push(base + 1, base + 3, base + 2);
        }
      }
      vertOffset += pts.length * 2;
    }

    if (positions.length === 0) continue;

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // Use MeshStandardMaterial with emissive for road glow
    const emissiveColor = new THREE.Color(spec.edgeGlow);
    const mat = new THREE.MeshStandardMaterial({
      color: spec.color,
      emissive: emissiveColor,
      emissiveIntensity: 0.08,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `road-${type}`;
    group.add(mesh);

    // Edge glow lines — brighter, thicker
    const isMajor = type === 'motorway' || type === 'trunk' || type === 'primary' || type === 'secondary' || type === 'tertiary';
    const glowOpacity = isMajor ? 0.75 : 0.3;

    for (const ei of edgeIndices) {
      const edge = graph.edges[ei];
      if (edge.pts.length < 2) continue;
      // Only draw glow for every Nth minor road to save draw calls
      if (!isMajor && ei % 3 !== 0) continue;

      const halfW = spec.width / 2;
      const glowPtsLeft: THREE.Vector3[] = [];
      const glowPtsRight: THREE.Vector3[] = [];

      for (let i = 0; i < edge.pts.length; i++) {
        let dx: number, dz: number;
        if (i < edge.pts.length - 1) {
          dx = edge.pts[i + 1].x - edge.pts[i].x;
          dz = edge.pts[i + 1].z - edge.pts[i].z;
        } else {
          dx = edge.pts[i].x - edge.pts[i - 1].x;
          dz = edge.pts[i].z - edge.pts[i - 1].z;
        }
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        const nx = -dz / len;
        const nz = dx / len;

        glowPtsLeft.push(new THREE.Vector3(edge.pts[i].x + nx * halfW, 0.06, edge.pts[i].z + nz * halfW));
        glowPtsRight.push(new THREE.Vector3(edge.pts[i].x - nx * halfW, 0.06, edge.pts[i].z - nz * halfW));
      }

      const glowMat = new THREE.LineBasicMaterial({
        color: spec.edgeGlow,
        transparent: true,
        opacity: glowOpacity,
      });

      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(glowPtsLeft), glowMat));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(glowPtsRight), glowMat));
    }
  }

  return group;
}
