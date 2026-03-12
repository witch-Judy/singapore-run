/**
 * fetch-osm.ts — Build-time script to fetch Singapore road data from Overpass API
 * Run: npx tsx scripts/fetch-osm.ts
 * Output: public/data/sg-roads.json
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Bounding box: covers Marina Bay → Orchard → Botanic Gardens with buffer
const BOUNDS = {
  south: 1.250,
  north: 1.320,
  west: 103.810,
  east: 103.880,
};

const HIGHWAY_TYPES = [
  'motorway', 'motorway_link', 'trunk', 'trunk_link',
  'primary', 'secondary', 'tertiary',
  'residential', 'service',
  'footway', 'cycleway', 'pedestrian',
  'living_street', 'unclassified',
];

interface OSMNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
}

interface OSMWay {
  type: 'way';
  id: number;
  nodes: number[];
  tags?: Record<string, string>;
}

interface Road {
  name: string;
  type: string;
  points: [number, number][]; // [lat, lng][]
}

async function fetchOSM(): Promise<void> {
  const bbox = `${BOUNDS.south},${BOUNDS.west},${BOUNDS.north},${BOUNDS.east}`;
  const hwFilter = HIGHWAY_TYPES.join('|');
  const query = `
    [out:json][timeout:60];
    (
      way["highway"~"${hwFilter}"](${bbox});
    );
    out body;
    >;
    out skel qt;
  `;

  console.log('🌏 Fetching Singapore road data from Overpass API...');
  console.log(`   Bounds: ${bbox}`);

  const response = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: 'data=' + encodeURIComponent(query),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!response.ok) {
    throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const elements = data.elements as (OSMNode | OSMWay)[];

  // Build node lookup
  const nodes = new Map<number, { lat: number; lon: number }>();
  let nodeCount = 0;
  for (const el of elements) {
    if (el.type === 'node') {
      nodes.set(el.id, { lat: el.lat, lon: el.lon });
      nodeCount++;
    }
  }

  // Extract roads
  const roads: Road[] = [];
  for (const el of elements) {
    if (el.type !== 'way' || !el.tags?.highway) continue;

    const points: [number, number][] = [];
    let valid = true;
    for (const nid of el.nodes) {
      const n = nodes.get(nid);
      if (!n) { valid = false; break; }
      points.push([n.lat, n.lon]);
    }

    if (valid && points.length >= 2) {
      roads.push({
        name: el.tags.name || '',
        type: el.tags.highway.replace('_link', ''),
        points,
      });
    }
  }

  // Write output
  const outDir = join(process.cwd(), 'public', 'data');
  mkdirSync(outDir, { recursive: true });

  const outPath = join(outDir, 'sg-roads.json');
  const output = { 
    generated: new Date().toISOString(),
    bounds: BOUNDS,
    stats: { nodes: nodeCount, roads: roads.length },
    roads,
  };

  writeFileSync(outPath, JSON.stringify(output));
  
  // Also write a pretty-printed version for debugging
  writeFileSync(
    join(outDir, 'sg-roads.debug.json'),
    JSON.stringify(output, null, 2)
  );

  const sizeKB = (Buffer.byteLength(JSON.stringify(output)) / 1024).toFixed(1);
  console.log(`✅ Done!`);
  console.log(`   ${roads.length} roads, ${nodeCount} nodes`);
  console.log(`   Output: ${outPath} (${sizeKB} KB)`);
  console.log(`   Road type breakdown:`);

  // Stats
  const typeCounts: Record<string, number> = {};
  for (const r of roads) {
    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
  }
  Object.entries(typeCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`     ${type}: ${count}`);
    });
}

fetchOSM().catch(err => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
