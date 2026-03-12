# CLAUDE.md — Singapore Run (跑图新加坡)

## What Is This Project

A browser-based 3D city exploration game where players run through Singapore's real road network. Inspired by "A Way To Go" (NFB) — rail-based movement locked to roads, drag to look around, choose your path at junctions. Players can switch between 5 wildly different vehicles mid-run (runner, scooter, eagle, Milo dinosaur, rocket).

**Core thesis:** "What if exploring a city felt like playing with a toy?"

**Creator:** Chenxiaoye (陈小爷) — independent project, not affiliated with any company.

## Key Design Decisions (Already Made)

These are settled. Don't re-debate them:

1. **Rail movement, not free-roam.** Player is locked to the road graph. Press forward to run, auto-follow road curvature. This is the core differentiator.
2. **Single HTML output for MVP.** No server, no backend, no database. Deploy to Vercel/GitHub Pages.
3. **Three.js, not Unity/Unreal.** Bundle size matters — target < 500KB gzipped. Must open in 3 seconds on 4G.
4. **Pre-baked OSM data.** Fetch from Overpass API at build time, bake into JSON. Zero runtime API calls.
5. **Night aesthetic.** Cyberpunk-noir meets tropical modernism. Dark background (#060610), neon teal accent (#00FFC8).
6. **5 vehicles at launch** with distinct speed, altitude, camera, and animation profiles.
7. **小红书 (Xiaohongshu) as primary distribution channel.** GIF-friendly moments, shareable, zero install.

## Tech Stack

```
Runtime:     Three.js (latest stable, r165+)
Language:    TypeScript (strict mode)
Build:       Vite
Deployment:  Vercel or GitHub Pages
Map Data:    OpenStreetMap via Overpass API (build-time fetch → static JSON)
Fonts:       Orbitron (HUD), Noto Sans SC (Chinese text)
```

**No React. No Next.js. No framework.** The entire UI is canvas + minimal DOM overlays for HUD. A framework would add weight with zero benefit.

## Project Structure

```
singapore-run/
├── CLAUDE.md              ← you are here
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html             ← entry point, minimal shell
├── public/
│   └── data/
│       └── sg-roads.json  ← pre-baked OSM road data
├── scripts/
│   └── fetch-osm.ts       ← build script: Overpass API → sg-roads.json
├── src/
│   ├── main.ts            ← entry: init scene, start game loop
│   ├── config.ts          ← constants, colors, vehicle definitions
│   ├── types.ts           ← TypeScript interfaces
│   ├── core/
│   │   ├── scene.ts       ← Three.js scene, camera, renderer, lights, post-processing
│   │   ├── loop.ts        ← requestAnimationFrame game loop
│   │   └── input.ts       ← keyboard, mouse, touch input manager
│   ├── map/
│   │   ├── graph.ts       ← road graph data structure (nodes + edges)
│   │   ├── loader.ts      ← load & parse sg-roads.json
│   │   ├── projection.ts  ← lat/lng → world XZ coordinate conversion
│   │   ├── roads.ts       ← 3D road mesh generation (surfaces, glow, dashes)
│   │   ├── buildings.ts   ← procedural building generation along roads
│   │   ├── landmarks.ts   ← MBS, Gardens by the Bay, Merlion, etc.
│   │   ├── water.ts       ← Marina Bay, Singapore River
│   │   └── trees.ts       ← procedural vegetation
│   ├── player/
│   │   ├── rail.ts        ← rail movement engine (edge traversal, junction detection)
│   │   ├── vehicles.ts    ← vehicle model factory (build 3D models per vehicle type)
│   │   ├── camera.ts      ← chase camera + free-look system
│   │   └── trail.ts       ← particle trail behind player
│   ├── ui/
│   │   ├── hud.ts         ← speed, distance, road name, landmark proximity
│   │   ├── minimap.ts     ← 2D canvas minimap overlay
│   │   ├── junction.ts    ← junction direction arrows UI
│   │   ├── loading.ts     ← loading screen with progress bar
│   │   └── intro.ts       ← start screen
│   └── effects/
│       ├── postprocess.ts ← EffectComposer: bloom, film grain, color grading
│       └── particles.ts   ← vehicle-specific particle systems
└── docs/
    └── Singapore_Run_PRD.docx
```

## Road Graph Data Structure

The most important data structure in the project:

```typescript
interface GraphNode {
  x: number;          // world X
  z: number;          // world Z
  edges: number[];    // indices into edges array
}

interface GraphEdge {
  from: number;       // node index
  to: number;         // node index
  pts: Vec2[];        // polyline points [{x, z}, ...]
  len: number;        // total polyline length
  name: string;       // road name (e.g., "Orchard Road")
  type: RoadType;     // 'motorway' | 'primary' | 'secondary' | ... 
}

// Node merging: hash (Math.round(x/0.4), Math.round(z/0.4)) to merge nodes within 0.4m
```

## Rail Movement Algorithm

```
State: { currentEdge: number, progress: 0..1, direction: +1|-1, speed: number }

Each frame:
  1. If forward input → accelerate toward vehicle.maxSpeed
  2. Else → decelerate (friction * 0.92)
  3. Advance: progress += (speed * dt / edge.len) * direction
  4. If progress > 1 or < 0:
     a. Find connected edges at endpoint node (exclude current edge)
     b. 0 options → reverse direction (dead end)
     c. 1 option → auto-continue onto that edge
     d. 2+ options → pause, show junction UI, wait for player choice
  5. Sample position: interpolate along edge polyline at current progress
  6. Face angle: atan2(dx, dz) of current polyline segment + direction offset
```

## Vehicle Definitions

| ID      | Speed | Altitude | Camera Dist | Camera Height | Bob Amp | Bob Freq | Character         |
|---------|-------|----------|-------------|---------------|---------|----------|-------------------|
| runner  | 0.30  | 0m       | 7           | 3             | 0.10    | 9        | Humanoid figure   |
| scooter | 0.52  | 0m       | 9           | 3.5           | 0.03    | 13       | E-scooter + rider |
| bird    | 0.72  | 12m      | 12          | 7             | 0.28    | 3        | Eagle, wing flap  |
| milo    | 0.38  | 0m       | 12          | 5             | 0.16    | 4        | Cute brontosaurus |
| rocket  | 1.00  | 20m      | 14          | 9             | 0.06    | 15       | Rocket + flame    |

## Coordinate Projection

```typescript
// Center of map area
const CENTER_LAT = 1.290;
const CENTER_LNG = 103.852;
const SCALE = 9000;

function latLngToWorld(lat: number, lng: number): { x: number, z: number } {
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos(CENTER_LAT * Math.PI / 180);
  return {
    x: (lng - CENTER_LNG) * mPerDegLng * SCALE / 1000,
    z: -(lat - CENTER_LAT) * mPerDegLat * SCALE / 1000,
  };
}
```

## OSM Data Fetch Script

Build-time script (`scripts/fetch-osm.ts`):

```
1. POST to https://overpass-api.de/api/interpreter
2. Query: all highway ways in bounding box (1.250,103.810,1.320,103.880) — covers Marina Bay to Orchard plus buffer
3. Parse response: extract nodes (id → lat/lng) and ways (node refs + tags)
4. Convert to simplified format: { name, type, points: [lat, lng][] }
5. Write to public/data/sg-roads.json
```

Add as npm script: `"fetch-map": "tsx scripts/fetch-osm.ts"`

## Post-Processing Pipeline (Critical for Quality)

This is what takes it from "prototype" to "A Way To Go quality":

```typescript
// Setup
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// 1. Bloom — neon glow on road edges, landmarks, vehicle trails
const bloom = new UnrealBloomPass(resolution, 0.8, 0.4, 0.85);
composer.addPass(bloom);

// 2. Film grain — subtle noise adds atmosphere
const film = new FilmPass(0.15, 0.025, 648, false);
composer.addPass(film);

// 3. Color grading via ShaderPass — push shadows blue, highlights warm
// Custom shader: mix(color, teal_tint, shadow_amount)
```

Import from `three/examples/jsm/postprocessing/*` — these are available in modern Three.js, not in the old CDN r128 we were stuck with in artifacts.

## Road Rendering Specs

| Road Type    | Width | Color    | Edge Glow | Center Dashes |
|-------------|-------|----------|-----------|---------------|
| motorway    | 7     | #3A3A55  | #FF6644   | Yes           |
| primary     | 5     | #30304A  | #FFAA44   | Yes           |
| secondary   | 3.5   | #2A2A42  | #44AAFF   | No            |
| tertiary    | 2.8   | #252540  | #44FFAA   | No            |
| residential | 2.0   | #222238  | None      | No            |
| footway     | 0.8   | #1A1A2C  | None      | No            |

## Landmarks

Rendered with special geometry + point lights + proximity label trigger:

| Landmark            | Lat     | Lng      | 3D Treatment                       |
|--------------------|---------|---------|------------------------------------|
| Marina Bay Sands    | 1.2834  | 103.8607 | 3 towers + surfboard + pool glow  |
| Gardens by the Bay  | 1.2816  | 103.8636 | 6 supertrees, RGB point lights    |
| Merlion Park        | 1.2868  | 103.8545 | Spawn point, teal glow pillar     |
| Raffles Place       | 1.2903  | 103.8520 | Tall CBD buildings cluster        |
| Orchard Road        | 1.3010  | 103.8415 | Retail glow, medium density       |
| Clarke Quay         | 1.2895  | 103.8450 | River-side, warm lights           |
| Chinatown           | 1.2835  | 103.8445 | Dense low-rise, Peranakan colors  |
| Fort Canning        | 1.2940  | 103.8465 | Park glow, elevated terrain       |

## Camera System

Two modes, blended:

**Chase mode** (default, while moving):
- Position: behind player at `(camDist, camHeight)` relative to facing direction
- Look-at: slightly ahead of player along road
- Lerp factor: 3-4 per frame (smooth follow)

**Free-look mode** (drag/swipe while stopped):
- yaw/pitch offsets applied to camera angle
- Camera pulls closer when stopped (camDist - 2)
- On release: yaw *= 0.92, pitch *= 0.92 each frame (smooth return)

## Build & Dev Commands

```bash
npm create vite@latest singapore-run -- --template vanilla-ts
cd singapore-run
npm install three @types/three
npm install -D tsx                    # for build scripts

# Dev
npm run dev                           # Vite dev server, hot reload

# Fetch map data (run once, or when expanding coverage)
npm run fetch-map                     # scripts/fetch-osm.ts → public/data/sg-roads.json

# Build
npm run build                         # → dist/ (single page, deploy anywhere)

# Deploy
npx vercel                            # or push to GitHub Pages
```

## Development Order

Follow this sequence. Each step produces a testable result:

### Step 1: Scaffold + Road Rendering
- Vite + Three.js + TypeScript setup
- Load sg-roads.json (start with hardcoded fallback if needed)
- Render road meshes on dark ground plane
- Static camera looking at Marina Bay
- **Checkpoint:** You see Singapore's road network in 3D

### Step 2: Road Graph + Rail Movement
- Build graph from road data (node merging)
- Implement edge traversal + polyline sampling
- Player cube moves along roads with W key
- Junction detection + auto-continue for single paths
- **Checkpoint:** Cube runs along real Singapore roads

### Step 3: Junction UI + Controls
- Direction arrows at multi-path junctions
- A/D selection, W for straightest
- Mouse drag free-look camera
- Touch input for mobile
- **Checkpoint:** Full navigation through road network

### Step 4: Vehicles + Player Models
- 5 vehicle types with distinct geometry
- Speed, altitude, bob, camera profiles
- Switching with 1-5 keys + bottom bar UI
- Trail particles per vehicle
- **Checkpoint:** Switch from runner to eagle mid-run, camera soars up

### Step 5: City Generation
- Procedural buildings along roads (CBD tall glass, residential low, Chinatown shophouses)
- Window lights on tall buildings
- Landmark special meshes (MBS, Supertrees)
- Trees, water (Marina Bay, Singapore River)
- **Checkpoint:** Feels like running through a city, not a road diagram

### Step 6: Post-Processing + Polish
- EffectComposer: bloom, film grain, color grading
- HUD: speed, distance, road name, landmark proximity, minimap
- Loading screen, intro screen
- Sound (ambient city, footsteps — stretch goal)
- **Checkpoint:** "A Way To Go" quality feel

### Step 7: Optimize + Ship
- Instanced geometry for buildings/trees
- LOD for distant objects
- Mobile performance pass (reduced draw distance, simplified materials)
- Bundle size audit (target < 500KB gzip)
- Deploy to Vercel
- **Checkpoint:** Live URL, 60fps desktop, 30fps mobile

## What NOT To Do

- Don't add React/Vue/Svelte — it adds nothing here
- Don't use a physics engine — movement is on-rail, not physical
- Don't fetch OSM at runtime — pre-bake everything
- Don't over-engineer file structure early — start monolithic, refactor when it hurts
- Don't optimize before Step 5 — get the full visual in place first, then profile
- Don't add multiplayer in v1 — it's a massive complexity spike for uncertain value

## Performance Budget

| Metric        | Target           | Hard Limit         |
|---------------|------------------|--------------------|
| FPS (desktop) | 60               | > 45               |
| FPS (mobile)  | 30               | > 20               |
| Load time     | < 3s on 4G       | < 5s               |
| Bundle (gzip) | < 500KB          | < 1MB              |
| Draw calls    | < 500            | < 800              |
| GPU memory    | < 200MB          | < 350MB            |

## Reference

- **A Way To Go:** http://a-way-to-go.com — the interaction model we're emulating
- **Three.js docs:** https://threejs.org/docs/
- **Overpass API:** https://overpass-api.de/
- **OSM highway types:** https://wiki.openstreetmap.org/wiki/Key:highway
- **PRD:** see `docs/Singapore_Run_PRD.docx` for full product spec
