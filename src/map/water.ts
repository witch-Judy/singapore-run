import * as THREE from 'three';
import { latLngToWorld } from './projection';

export function createWater(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'water';

  // Marina Bay - large water body
  const bayCenter = latLngToWorld(1.2840, 103.8570);
  const bayGeo = new THREE.CircleGeometry(45, 32);
  const waterMat = new THREE.MeshBasicMaterial({
    color: 0x0a1a30,
    transparent: true,
    opacity: 0.8,
  });
  const bay = new THREE.Mesh(bayGeo, waterMat);
  bay.rotation.x = -Math.PI / 2;
  bay.position.set(bayCenter.x, 0.02, bayCenter.z);
  group.add(bay);

  // Water surface shimmer
  const shimmerMat = new THREE.MeshBasicMaterial({
    color: 0x1144aa,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  });
  const shimmer = new THREE.Mesh(new THREE.CircleGeometry(43, 32), shimmerMat);
  shimmer.rotation.x = -Math.PI / 2;
  shimmer.position.set(bayCenter.x, 0.08, bayCenter.z);
  shimmer.name = 'water-shimmer';
  group.add(shimmer);

  // Singapore River - a curved strip
  const riverPoints = [
    latLngToWorld(1.2870, 103.8540),
    latLngToWorld(1.2880, 103.8510),
    latLngToWorld(1.2886, 103.8480),
    latLngToWorld(1.2890, 103.8455),
    latLngToWorld(1.2895, 103.8435),
    latLngToWorld(1.2900, 103.8410),
    latLngToWorld(1.2910, 103.8385),
  ];

  const riverWidth = 4;
  const riverPositions: number[] = [];
  const riverIndices: number[] = [];

  for (let i = 0; i < riverPoints.length; i++) {
    const p = riverPoints[i];
    let dx: number, dz: number;
    if (i < riverPoints.length - 1) {
      dx = riverPoints[i + 1].x - p.x;
      dz = riverPoints[i + 1].z - p.z;
    } else {
      dx = p.x - riverPoints[i - 1].x;
      dz = p.z - riverPoints[i - 1].z;
    }
    const len = Math.sqrt(dx * dx + dz * dz) || 1;
    const nx = -dz / len * riverWidth / 2;
    const nz = dx / len * riverWidth / 2;

    riverPositions.push(p.x + nx, 0.03, p.z + nz);
    riverPositions.push(p.x - nx, 0.03, p.z - nz);

    if (i < riverPoints.length - 1) {
      const base = i * 2;
      riverIndices.push(base, base + 1, base + 2);
      riverIndices.push(base + 1, base + 3, base + 2);
    }
  }

  const riverGeo = new THREE.BufferGeometry();
  riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(riverPositions, 3));
  riverGeo.setIndex(riverIndices);
  const river = new THREE.Mesh(riverGeo, new THREE.MeshBasicMaterial({
    color: 0x0a1830,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
  }));
  group.add(river);

  return group;
}

/** Animate water shimmer */
export function updateWater(group: THREE.Group, elapsed: number): void {
  const shimmer = group.getObjectByName('water-shimmer') as THREE.Mesh | undefined;
  if (shimmer) {
    (shimmer.material as THREE.MeshBasicMaterial).opacity = 0.1 + Math.sin(elapsed * 0.8) * 0.05;
    shimmer.position.y = 0.08 + Math.sin(elapsed * 0.5) * 0.02;
  }
}
