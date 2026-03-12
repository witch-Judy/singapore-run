import * as THREE from 'three';
import { latLngToWorld } from './projection';
import { ACCENT_COLOR } from '../config';

export function createLandmarks(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'landmarks';

  // Marina Bay Sands
  createMBS(group);

  // Gardens by the Bay - Supertrees
  createSupertrees(group);

  // Merlion
  createMerlion(group);

  // CBD Towers cluster at Raffles Place
  createCBDCluster(group);

  // Clarke Quay warm lights
  createClarkeQuay(group);

  return group;
}

function createMBS(parent: THREE.Group) {
  const pos = latLngToWorld(1.2834, 103.8607);
  const mbsGroup = new THREE.Group();
  mbsGroup.position.set(pos.x, 0, pos.z);

  // 3 towers
  const towerMat = new THREE.MeshLambertMaterial({ color: 0x3a4565, emissive: 0x1a2540 });
  const towerGeo = new THREE.BoxGeometry(4, 55, 3);

  for (let i = -1; i <= 1; i++) {
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(i * 8, 27.5, 0);
    // Slight lean outward
    tower.rotation.z = i * 0.02;
    mbsGroup.add(tower);

    // Window strips
    const windowMat = new THREE.MeshBasicMaterial({ color: 0x66bbff, transparent: true, opacity: 0.85 });
    for (let f = 0; f < 15; f++) {
      const strip = new THREE.Mesh(
        new THREE.PlaneGeometry(3.5, 0.3),
        windowMat,
      );
      strip.position.set(i * 8, 5 + f * 3.5, 1.55);
      mbsGroup.add(strip);
    }
  }

  // SkyPark (the surfboard on top)
  const parkGeo = new THREE.BoxGeometry(30, 1, 6);
  const parkMat = new THREE.MeshLambertMaterial({ color: 0x3a4055, emissive: 0x111828 });
  const park = new THREE.Mesh(parkGeo, parkMat);
  park.position.set(0, 56, 0);
  mbsGroup.add(park);

  // Pool glow on top
  const poolGeo = new THREE.PlaneGeometry(24, 3);
  const poolMat = new THREE.MeshBasicMaterial({ color: 0x00ddff, transparent: true, opacity: 0.8 });
  const pool = new THREE.Mesh(poolGeo, poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 56.6, 0);
  mbsGroup.add(pool);

  // Glow lights
  const topLight = new THREE.PointLight(0x4488ff, 5, 120);
  topLight.position.set(0, 58, 0);
  mbsGroup.add(topLight);

  const baseLight = new THREE.PointLight(0x2266cc, 3, 60);
  baseLight.position.set(0, 10, 0);
  mbsGroup.add(baseLight);

  parent.add(mbsGroup);
}

function createSupertrees(parent: THREE.Group) {
  const center = latLngToWorld(1.2816, 103.8636);

  const treePositions = [
    [0, 0], [-12, 8], [10, 6], [-6, -10], [14, -5], [-14, -8],
  ];

  for (const [ox, oz] of treePositions) {
    const treeGroup = new THREE.Group();
    treeGroup.position.set(center.x + ox, 0, center.z + oz);

    const height = 18 + Math.random() * 12;

    // Trunk - tapered cylinder
    const trunkGeo = new THREE.CylinderGeometry(0.4, 0.8, height, 8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x334433, emissive: 0x111511 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = height / 2;
    treeGroup.add(trunk);

    // Canopy - inverted cone
    const canopyGeo = new THREE.ConeGeometry(5, 4, 12);
    const canopyMat = new THREE.MeshLambertMaterial({ color: 0x226644, emissive: 0x113322 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = height + 1;
    canopy.rotation.x = Math.PI; // inverted
    treeGroup.add(canopy);

    // RGB point light on each tree
    const colors = [0xff0066, 0x00ff88, 0x4488ff, 0xff8800, 0xaa00ff, 0x00ffcc];
    const light = new THREE.PointLight(colors[Math.abs(ox + oz) % colors.length], 2, 30);
    light.position.set(0, height + 3, 0);
    treeGroup.add(light);

    parent.add(treeGroup);
  }
}

function createMerlion(parent: THREE.Group) {
  const pos = latLngToWorld(1.2868, 103.8545);
  const merlionGroup = new THREE.Group();
  merlionGroup.position.set(pos.x, 0, pos.z);

  // Base pedestal
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x555566 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.5, 3, 8), baseMat);
  base.position.y = 1.5;
  merlionGroup.add(base);

  // Body
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0x888899, emissive: 0x222233 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 5, 8), bodyMat);
  body.position.y = 5.5;
  merlionGroup.add(body);

  // Head
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), bodyMat);
  head.position.y = 9;
  head.scale.set(1, 0.8, 1.2);
  merlionGroup.add(head);

  // Teal glow pillar (spawn point marker)
  const glowGeo = new THREE.CylinderGeometry(0.3, 0.3, 25, 6);
  const glowMat = new THREE.MeshBasicMaterial({ color: ACCENT_COLOR, transparent: true, opacity: 0.15 });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = 12.5;
  merlionGroup.add(glow);

  const light = new THREE.PointLight(ACCENT_COLOR, 3, 50);
  light.position.set(0, 10, 0);
  merlionGroup.add(light);

  parent.add(merlionGroup);
}

function createCBDCluster(parent: THREE.Group) {
  const center = latLngToWorld(1.2903, 103.8520);
  const towers = [
    { ox: 0, oz: 0, w: 5, d: 5, h: 70 },
    { ox: 10, oz: 5, w: 4, d: 6, h: 55 },
    { ox: -8, oz: 3, w: 6, d: 4, h: 60 },
    { ox: 5, oz: -8, w: 4, d: 4, h: 50 },
    { ox: -5, oz: -6, w: 5, d: 5, h: 45 },
    { ox: 12, oz: -3, w: 3, d: 5, h: 48 },
    { ox: -12, oz: -4, w: 4, d: 3, h: 42 },
  ];

  const towerMat = new THREE.MeshLambertMaterial({ color: 0x2a3560, emissive: 0x152040 });
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x4488cc, transparent: true, opacity: 0.5 });

  for (const t of towers) {
    const geo = new THREE.BoxGeometry(t.w, t.h, t.d);
    const mesh = new THREE.Mesh(geo, towerMat);
    mesh.position.set(center.x + t.ox, t.h / 2, center.z + t.oz);
    parent.add(mesh);

    // Glass face
    const glassGeo = new THREE.PlaneGeometry(t.w - 0.5, t.h - 2);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(center.x + t.ox, t.h / 2, center.z + t.oz + t.d / 2 + 0.05);
    parent.add(glass);
  }

  // Area lights
  const light1 = new THREE.PointLight(0x4466aa, 4, 80);
  light1.position.set(center.x, 40, center.z);
  parent.add(light1);
  const light2 = new THREE.PointLight(0x3355aa, 2, 50);
  light2.position.set(center.x + 10, 15, center.z);
  parent.add(light2);
}

function createClarkeQuay(parent: THREE.Group) {
  const pos = latLngToWorld(1.2895, 103.8450);

  // Warm colored low buildings
  const colors = [0xff6644, 0xffaa22, 0xff4488, 0xaa44ff, 0x44aaff];

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const r = 5 + Math.random() * 10;
    const h = 3 + Math.random() * 5;
    const color = colors[i % colors.length];

    const geo = new THREE.BoxGeometry(2 + Math.random() * 2, h, 2 + Math.random() * 2);
    const mat = new THREE.MeshLambertMaterial({ color, emissive: new THREE.Color(color).multiplyScalar(0.2) });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(
      pos.x + Math.cos(angle) * r,
      h / 2,
      pos.z + Math.sin(angle) * r,
    );
    parent.add(mesh);
  }

  // Warm point lights
  for (let i = 0; i < 4; i++) {
    const light = new THREE.PointLight(0xff8844, 1.5, 25);
    light.position.set(
      pos.x + (Math.random() - 0.5) * 15,
      5,
      pos.z + (Math.random() - 0.5) * 15,
    );
    parent.add(light);
  }
}
