import * as THREE from 'three';
import type { RoadGraph } from './graph';
import { ROAD_SPECS } from '../config';

// Building style zones (approximate world coords)
import { latLngToWorld } from './projection';

const CBD_CENTER = latLngToWorld(1.2830, 103.8515);
const CHINATOWN_CENTER = latLngToWorld(1.2835, 103.8445);
const ORCHARD_CENTER = latLngToWorld(1.3010, 103.8415);

function distTo(x: number, z: number, cx: number, cz: number): number {
  return Math.sqrt((x - cx) * (x - cx) + (z - cz) * (z - cz));
}

interface BuildingParams {
  minH: number;
  maxH: number;
  baseColor: number;
  windowColor: number;
  emissive: number;
  density: number; // 0-1, chance to place
}

function getZoneParams(x: number, z: number): BuildingParams {
  const cbdDist = distTo(x, z, CBD_CENTER.x, CBD_CENTER.z);
  const chinaDist = distTo(x, z, CHINATOWN_CENTER.x, CHINATOWN_CENTER.z);
  const orchardDist = distTo(x, z, ORCHARD_CENTER.x, ORCHARD_CENTER.z);

  // CBD - tall glass towers, bright blue
  if (cbdDist < 60) {
    return { minH: 15, maxH: 65, baseColor: 0x2a3555, windowColor: 0x66bbff, emissive: 0x1a3366, density: 0.7 };
  }
  // Chinatown - dense low-rise, warm Peranakan colors
  if (chinaDist < 40) {
    return { minH: 3, maxH: 8, baseColor: 0x5a3030, windowColor: 0xffcc66, emissive: 0x552200, density: 0.8 };
  }
  // Orchard - medium retail, cool blue
  if (orchardDist < 50) {
    return { minH: 6, maxH: 20, baseColor: 0x353555, windowColor: 0x88ccff, emissive: 0x222244, density: 0.6 };
  }
  // Default residential
  return { minH: 3, maxH: 12, baseColor: 0x252540, windowColor: 0x556688, emissive: 0x151530, density: 0.35 };
}

export function createBuildings(graph: RoadGraph): THREE.Group {
  const group = new THREE.Group();
  group.name = 'buildings';

  // Use instanced meshes for performance
  // We'll create buildings along road edges
  const rng = mulberry32(42); // deterministic random

  const buildingPositions: { x: number; z: number; w: number; d: number; h: number; params: BuildingParams }[] = [];

  for (let ei = 0; ei < graph.edges.length; ei++) {
    const edge = graph.edges[ei];
    const spec = ROAD_SPECS[edge.type];
    if (!spec) continue;

    // Skip footways/cycleways - too narrow for buildings
    if (edge.type === 'footway' || edge.type === 'cycleway' || edge.type === 'pedestrian') continue;

    const roadWidth = spec.width;
    const offset = roadWidth / 2 + 2; // distance from road center

    // Sample along edge at intervals
    const interval = edge.type === 'residential' || edge.type === 'service' ? 12 : 8;
    let traveled = 0;

    for (let i = 1; i < edge.pts.length; i++) {
      const ax = edge.pts[i - 1].x, az = edge.pts[i - 1].z;
      const bx = edge.pts[i].x, bz = edge.pts[i].z;
      const dx = bx - ax, dz = bz - az;
      const segLen = Math.sqrt(dx * dx + dz * dz);
      if (segLen < 0.5) { traveled += segLen; continue; }

      const nx = -dz / segLen;
      const nz = dx / segLen;

      let t = 0;
      while (t < segLen) {
        const frac = t / segLen;
        const px = ax + dx * frac;
        const pz = az + dz * frac;
        const params = getZoneParams(px, pz);

        if (rng() < params.density * 0.15) {
          // Place on one or both sides
          for (const side of [1, -1]) {
            if (rng() > 0.6) continue;
            const bx2 = px + nx * (offset + rng() * 4) * side;
            const bz2 = pz + nz * (offset + rng() * 4) * side;
            const h = params.minH + rng() * (params.maxH - params.minH);
            const w = 2 + rng() * 4;
            const d = 2 + rng() * 4;
            buildingPositions.push({ x: bx2, z: bz2, w, d, h, params });
          }
        }
        t += interval;
      }
      traveled += segLen;
    }
  }

  // Batch create buildings using merged geometry for performance
  // Split into chunks by color zone
  const batches = new Map<number, { positions: number[]; indices: number[]; colors: number[]; vertCount: number }>();

  for (const b of buildingPositions) {
    const key = b.params.baseColor;
    if (!batches.has(key)) {
      batches.set(key, { positions: [], indices: [], colors: [], vertCount: 0 });
    }
    const batch = batches.get(key)!;
    addBoxGeometry(batch, b.x, b.h / 2, b.z, b.w, b.h, b.d, b.params);
  }

  for (const [baseColor, batch] of batches) {
    if (batch.positions.length === 0) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(batch.positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(batch.colors, 3));
    geo.setIndex(batch.indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshLambertMaterial({
      vertexColors: true,
      emissive: new THREE.Color(baseColor).multiplyScalar(0.6),
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
  }

  // Add window lights using a separate pass - emissive small quads on tall buildings
  const windowGroup = createWindowLights(buildingPositions, rng);
  group.add(windowGroup);

  return group;
}

function addBoxGeometry(
  batch: { positions: number[]; indices: number[]; colors: number[]; vertCount: number },
  cx: number, cy: number, cz: number,
  w: number, h: number, d: number,
  params: BuildingParams,
) {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const v = batch.vertCount;

  // Base color with slight variation
  const base = new THREE.Color(params.baseColor);
  const r = base.r, g = base.g, b = base.b;

  // 8 vertices of box
  const verts = [
    cx - hw, cy - hh, cz - hd,  // 0 bottom
    cx + hw, cy - hh, cz - hd,  // 1
    cx + hw, cy - hh, cz + hd,  // 2
    cx - hw, cy - hh, cz + hd,  // 3
    cx - hw, cy + hh, cz - hd,  // 4 top
    cx + hw, cy + hh, cz - hd,  // 5
    cx + hw, cy + hh, cz + hd,  // 6
    cx - hw, cy + hh, cz + hd,  // 7
  ];

  for (let i = 0; i < verts.length; i += 3) {
    batch.positions.push(verts[i], verts[i + 1], verts[i + 2]);
    // Top faces slightly brighter
    const topFactor = verts[i + 1] > cy ? 1.3 : 1.0;
    batch.colors.push(r * topFactor, g * topFactor, b * topFactor);
  }

  // 6 faces (12 triangles)
  const faces = [
    0,1,5, 0,5,4, // front
    2,3,7, 2,7,6, // back
    1,2,6, 1,6,5, // right
    3,0,4, 3,4,7, // left
    4,5,6, 4,6,7, // top
    3,2,1, 3,1,0, // bottom
  ];
  for (const idx of faces) {
    batch.indices.push(v + idx);
  }

  batch.vertCount += 8;
}

function createWindowLights(
  buildings: { x: number; z: number; w: number; d: number; h: number; params: BuildingParams }[],
  rng: () => number,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'windows';

  const windowPositions: number[] = [];
  const windowColors: number[] = [];

  for (const b of buildings) {
    if (b.h < 8) continue; // Only tall buildings get visible windows

    const floors = Math.floor(b.h / 3);
    const windowsPerFloor = Math.floor(Math.max(b.w, b.d) / 1.5);
    const wColor = new THREE.Color(b.params.windowColor);

    for (let f = 1; f < floors; f++) {
      for (let wi = 0; wi < windowsPerFloor; wi++) {
        if (rng() > 0.4) continue; // Not all windows lit

        const y = f * 3 + 0.5;
        const side = Math.floor(rng() * 4);
        let wx: number, wz: number;

        switch (side) {
          case 0: wx = b.x - b.w / 2 - 0.05; wz = b.z + (rng() - 0.5) * b.d * 0.8; break;
          case 1: wx = b.x + b.w / 2 + 0.05; wz = b.z + (rng() - 0.5) * b.d * 0.8; break;
          case 2: wx = b.x + (rng() - 0.5) * b.w * 0.8; wz = b.z - b.d / 2 - 0.05; break;
          default: wx = b.x + (rng() - 0.5) * b.w * 0.8; wz = b.z + b.d / 2 + 0.05; break;
        }

        windowPositions.push(wx, y, wz);
        const brightness = 0.5 + rng() * 0.5;
        windowColors.push(wColor.r * brightness, wColor.g * brightness, wColor.b * brightness);
      }
    }
  }

  if (windowPositions.length > 0) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(windowPositions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(windowColors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    group.add(points);
  }

  return group;
}

// Deterministic PRNG
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
