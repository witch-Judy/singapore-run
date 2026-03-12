import * as THREE from 'three';

const PARTICLE_COUNT = 200;

/** Ambient floating particles in the scene (dust, fireflies) */
export function createAmbientParticles(): THREE.Points {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 300;
    positions[i * 3 + 1] = 1 + Math.random() * 30;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

    // Teal-ish with some warm variation
    const warm = Math.random() > 0.7;
    colors[i * 3] = warm ? 0.8 : 0.0;
    colors[i * 3 + 1] = warm ? 0.5 : 0.7 + Math.random() * 0.3;
    colors[i * 3 + 2] = warm ? 0.2 : 0.5 + Math.random() * 0.3;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.4,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geo, mat);
  points.name = 'ambient-particles';
  return points;
}

/** Move particles around player */
export function updateAmbientParticles(particles: THREE.Points, playerX: number, playerZ: number, elapsed: number): void {
  const positions = particles.geometry.attributes.position;
  const arr = positions.array as Float32Array;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    // Drift slowly
    arr[i * 3 + 1] += Math.sin(elapsed + i) * 0.01;

    // Keep near player
    const dx = arr[i * 3] - playerX;
    const dz = arr[i * 3 + 2] - playerZ;
    if (dx * dx + dz * dz > 150 * 150) {
      arr[i * 3] = playerX + (Math.random() - 0.5) * 200;
      arr[i * 3 + 2] = playerZ + (Math.random() - 0.5) * 200;
    }
  }

  positions.needsUpdate = true;
}
