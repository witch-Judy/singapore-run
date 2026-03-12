import { createScene } from './core/scene';
import { createInputManager } from './core/input';
import { startLoop } from './core/loop';
import { loadRoadData } from './map/loader';
import { buildGraph, findNearestEdge, sampleEdge } from './map/graph';
import type { RoadGraph } from './map/graph';
import { createRoadMeshes } from './map/roads';
import { createBuildings } from './map/buildings';
import { createLandmarks } from './map/landmarks';
import { createWater, updateWater } from './map/water';
import { createTrees } from './map/trees';
import { latLngToWorld } from './map/projection';
import { updateRail, transitionToEdge, chooseStraightest } from './player/rail';
import { updateCamera } from './player/camera';
import { createVehicleModel } from './player/vehicles';
import { Trail } from './player/trail';
import { createPostProcessing } from './effects/postprocess';
import { createAmbientParticles, updateAmbientParticles } from './effects/particles';
import { initHUD, updateHUD } from './ui/hud';
import { showJunction, hideJunction } from './ui/junction';
import { setLoadProgress, hideLoading } from './ui/loading';
import { VEHICLES } from './config';
import type { PlayerState } from './types';

async function init() {
  const appEl = document.getElementById('app')!;

  // 1. Create scene
  setLoadProgress(10, 'creating scene...');
  const { scene, camera, renderer } = createScene(appEl);

  // 2. Load road data
  setLoadProgress(20, 'loading map data...');
  const roadFile = await loadRoadData();

  // 3. Build graph
  setLoadProgress(35, 'building road graph...');
  const graph: RoadGraph = buildGraph(roadFile.roads);
  console.log(`Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

  // 4. Create road meshes
  setLoadProgress(45, 'rendering roads...');
  const roadGroup = createRoadMeshes(graph);
  scene.add(roadGroup);

  // 5. Buildings
  setLoadProgress(55, 'generating buildings...');
  const buildings = createBuildings(graph);
  scene.add(buildings);

  // 6. Landmarks
  setLoadProgress(65, 'placing landmarks...');
  const landmarks = createLandmarks();
  scene.add(landmarks);

  // 7. Water
  setLoadProgress(72, 'filling water...');
  const water = createWater();
  scene.add(water);

  // 8. Trees
  setLoadProgress(78, 'planting trees...');
  const trees = createTrees(graph);
  scene.add(trees);

  // 9. Ambient particles
  const particles = createAmbientParticles();
  scene.add(particles);

  // 10. Post-processing
  setLoadProgress(85, 'applying effects...');
  const postProcess = createPostProcessing(renderer, scene, camera);

  // 11. Init player
  setLoadProgress(90, 'initializing player...');
  const merlionPos = latLngToWorld(1.2868, 103.8545);
  const startEdge = findNearestEdge(graph, merlionPos.x, merlionPos.z);

  const player: PlayerState = {
    currentEdge: startEdge.edge,
    progress: startEdge.progress,
    direction: 1,
    speed: 0,
    vehicleIndex: 0,
    totalDistance: 0,
  };

  // Create vehicle model
  let vehicleModel = createVehicleModel(0);
  scene.add(vehicleModel);

  const trail = new Trail();
  scene.add(trail.mesh);

  // 12. Input
  const input = createInputManager(renderer.domElement);

  // 13. HUD
  initHUD();

  // Vehicle switching
  window.addEventListener('vehicle-switch', ((e: CustomEvent) => {
    const idx = e.detail as number;
    if (idx === player.vehicleIndex) return;
    player.vehicleIndex = idx;
    scene.remove(vehicleModel);
    vehicleModel = createVehicleModel(idx);
    scene.add(vehicleModel);
    trail.clear();
  }) as EventListener);

  // Junction state
  let junctionActive = false;
  let junctionNodeIdx = -1;

  setLoadProgress(100, 'ready!');
  setTimeout(hideLoading, 400);

  // 14. Game loop
  startLoop(
    (dt, elapsed) => {
      // Update post-processing uniforms
      postProcess.colorGradePass.uniforms['time'].value = elapsed;

      // Animate water
      updateWater(water, elapsed);

      // Junction input handling
      if (junctionActive && !input.left && !input.right && input.forward) {
        const edge = graph.edges[player.currentEdge];
        const nodeIdx = junctionNodeIdx;
        const candidates = graph.nodes[nodeIdx].edges.filter(ei => ei !== player.currentEdge);
        const pos = sampleEdge(edge, player.progress);
        const angle = player.direction === 1 ? pos.angle : pos.angle + Math.PI;
        const best = chooseStraightest(graph, player.currentEdge, nodeIdx, candidates, angle);
        transitionToEdge(player, graph, best, nodeIdx);
        hideJunction();
        junctionActive = false;
      }

      if (!junctionActive) {
        const result = updateRail(player, input, graph, dt);

        if (result.junctionEdges) {
          junctionActive = true;
          const edge = graph.edges[player.currentEdge];
          junctionNodeIdx = player.progress >= 0.99 ? edge.to : edge.from;
          showJunction(graph, result.junctionEdges, junctionNodeIdx, (edgeIdx) => {
            transitionToEdge(player, graph, edgeIdx, junctionNodeIdx);
            junctionActive = false;
          });
        }

        // Update vehicle model
        const vehicle = VEHICLES[player.vehicleIndex];
        const bob = Math.sin(elapsed * vehicle.bobFreq) * vehicle.bobAmp;

        vehicleModel.position.set(result.x, vehicle.altitude + bob, result.z);
        vehicleModel.rotation.y = result.angle;

        // Trail
        if (player.speed > 0.01) {
          trail.update(result.x, vehicle.altitude + 0.2, result.z);
        }

        // Camera
        updateCamera(camera, result.x, result.z, result.angle, vehicle.altitude, vehicle, input, dt);

        // Ambient particles follow player
        updateAmbientParticles(particles, result.x, result.z, elapsed);

        // HUD
        const roadName = graph.edges[player.currentEdge]?.name || '';
        updateHUD(player, roadName, result.x, result.z);

        // Animate vehicle parts
        if (vehicle.id === 'bird') {
          const leftWing = vehicleModel.getObjectByName('wing-left');
          const rightWing = vehicleModel.getObjectByName('wing-right');
          if (leftWing) leftWing.rotation.z = 0.2 + Math.sin(elapsed * 3) * 0.4;
          if (rightWing) rightWing.rotation.z = -0.2 - Math.sin(elapsed * 3) * 0.4;
        }
        if (vehicle.id === 'rocket') {
          const flame = vehicleModel.getObjectByName('flame');
          if (flame) flame.scale.y = 0.8 + Math.random() * 0.4;
        }
      }
    },
    () => postProcess.composer.render(),
  );
}

init().catch(err => {
  console.error('Failed to initialize:', err);
  setLoadProgress(0, `Error: ${err.message}`);
});
