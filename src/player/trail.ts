import * as THREE from 'three';

const MAX_TRAIL_POINTS = 80;

export class Trail {
  private positions: THREE.Vector3[] = [];
  private line: THREE.Line;

  constructor(color: number = 0x00FFC8) {
    const geo = new THREE.BufferGeometry();
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.5,
    });
    this.line = new THREE.Line(geo, mat);
    this.line.frustumCulled = false;
  }

  get mesh(): THREE.Line { return this.line; }

  update(x: number, y: number, z: number): void {
    this.positions.push(new THREE.Vector3(x, y, z));
    if (this.positions.length > MAX_TRAIL_POINTS) {
      this.positions.shift();
    }
    this.line.geometry.dispose();
    this.line.geometry = new THREE.BufferGeometry().setFromPoints(this.positions);
  }

  clear(): void {
    this.positions = [];
  }
}
