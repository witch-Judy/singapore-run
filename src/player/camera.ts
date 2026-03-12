import * as THREE from 'three';
import type { VehicleConfig, InputState } from '../types';

const LERP_SPEED = 3.5;
const _targetPos = new THREE.Vector3();
const _lookAt = new THREE.Vector3();

export function updateCamera(
  camera: THREE.PerspectiveCamera,
  playerX: number,
  playerZ: number,
  playerAngle: number,
  altitude: number,
  vehicle: VehicleConfig,
  input: InputState,
  dt: number,
): void {
  const yawOffset = input.dragX;
  const pitchOffset = input.dragY;

  // Dampen free-look when not dragging
  if (!input.dragging) {
    input.dragX *= 0.92;
    input.dragY *= 0.92;
  }

  const angle = playerAngle + yawOffset;
  const dist = vehicle.camDist;
  const height = vehicle.camHeight + pitchOffset * 5;

  // Camera behind player
  _targetPos.set(
    playerX - Math.sin(angle) * dist,
    altitude + height,
    playerZ - Math.cos(angle) * dist,
  );

  // Smooth follow
  const t = 1 - Math.exp(-LERP_SPEED * dt);
  camera.position.lerp(_targetPos, t);

  // Look at point slightly ahead of player
  _lookAt.set(
    playerX + Math.sin(playerAngle) * 3,
    altitude + 1,
    playerZ + Math.cos(playerAngle) * 3,
  );
  camera.lookAt(_lookAt);
}
