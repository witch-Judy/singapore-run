import * as THREE from 'three';

const PARTICLE_COUNT = 300;

/** Ambient floating particles — firefly-like specks scattered in the city */
export function createAmbientParticles(): THREE.Points {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 200;
    positions[i * 3 + 1] = 0.5 + Math.random() * 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

    // Brighter teal / warm mix
    const warm = Math.random() > 0.75;
    colors[i * 3] = warm ? 1.0 : 0.0;
    colors[i * 3 + 1] = warm ? 0.7 : 1.0;
    colors[i * 3 + 2] = warm ? 0.3 : 0.8;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.8,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
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
