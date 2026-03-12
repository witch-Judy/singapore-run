import * as THREE from 'three';
import type { RoadGraph } from './graph';
import { latLngToWorld } from './projection';

export function createTrees(graph: RoadGraph): THREE.Group {
  const group = new THREE.Group();
  group.name = 'trees';

  // Fort Canning park area - dense trees
  const parkCenter = latLngToWorld(1.2940, 103.8465);
  const parkTrees = generateParkTrees(parkCenter.x, parkCenter.z, 35, 80);

  // Gardens area
  const gardensCenter = latLngToWorld(1.2816, 103.8636);
  const gardenTrees = generateParkTrees(gardensCenter.x, gardensCenter.z, 40, 60);

  // Roadside trees (sparse, along primary/secondary roads)
  const roadsideTrees = generateRoadsideTrees(graph);

  const allTrees = [...parkTrees, ...gardenTrees, ...roadsideTrees];

  // Use instanced mesh for performance
  const trunkGeo = new THREE.CylinderGeometry(0.15, 0.2, 3, 5);
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x2a3a2a });
  const trunkInstanced = new THREE.InstancedMesh(trunkGeo, trunkMat, allTrees.length);

  const canopyGeo = new THREE.SphereGeometry(1.5, 6, 5);
  const canopyMat = new THREE.MeshLambertMaterial({ color: 0x1a4a2a, emissive: 0x081a0a });
  const canopyInstanced = new THREE.InstancedMesh(canopyGeo, canopyMat, allTrees.length);

  const matrix = new THREE.Matrix4();

  for (let i = 0; i < allTrees.length; i++) {
    const t = allTrees[i];

    // Trunk
    matrix.makeTranslation(t.x, 1.5, t.z);
    matrix.multiply(new THREE.Matrix4().makeScale(1, 0.7 + t.scale * 0.5, 1));
    trunkInstanced.setMatrixAt(i, matrix);

    // Canopy
    matrix.makeTranslation(t.x, 3 + t.scale, t.z);
    matrix.multiply(new THREE.Matrix4().makeScale(t.scale, t.scale * 0.8, t.scale));
    canopyInstanced.setMatrixAt(i, matrix);
  }

  group.add(trunkInstanced);
  group.add(canopyInstanced);

  return group;
}

interface TreePos { x: number; z: number; scale: number; }

function generateParkTrees(cx: number, cz: number, radius: number, count: number): TreePos[] {
  const trees: TreePos[] = [];
  let seed = Math.abs(cx * 100 + cz) | 0;

  for (let i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const angle = (seed / 0x7fffffff) * Math.PI * 2;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const r = (seed / 0x7fffffff) * radius;
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    const scale = 0.6 + (seed / 0x7fffffff) * 0.8;

    trees.push({
      x: cx + Math.cos(angle) * r,
      z: cz + Math.sin(angle) * r,
      scale,
    });
  }
  return trees;
}

function generateRoadsideTrees(graph: RoadGraph): TreePos[] {
  const trees: TreePos[] = [];
  let seed = 7777;

  for (let ei = 0; ei < graph.edges.length; ei += 5) {
    const edge = graph.edges[ei];
    if (edge.type !== 'primary' && edge.type !== 'secondary' && edge.type !== 'tertiary') continue;

    for (let i = 0; i < edge.pts.length; i += 4) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      if ((seed / 0x7fffffff) > 0.3) continue;

      const p = edge.pts[i];
      let dx = 0, dz = 1;
      if (i < edge.pts.length - 1) {
        dx = edge.pts[i + 1].x - p.x;
        dz = edge.pts[i + 1].z - p.z;
        const len = Math.sqrt(dx * dx + dz * dz) || 1;
        dx /= len; dz /= len;
      }

      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const side = (seed & 1) ? 1 : -1;
      const offset = 4 + (seed / 0x7fffffff) * 3;

      trees.push({
        x: p.x + (-dz) * offset * side,
        z: p.z + dx * offset * side,
        scale: 0.5 + (seed / 0x7fffffff) * 0.6,
      });
    }
  }

  return trees;
}
