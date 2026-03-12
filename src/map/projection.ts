import { CENTER_LAT, CENTER_LNG, SCALE } from '../config';
import type { Vec2 } from '../types';

const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 111320 * Math.cos(CENTER_LAT * Math.PI / 180);

export function latLngToWorld(lat: number, lng: number): Vec2 {
  return {
    x: (lng - CENTER_LNG) * M_PER_DEG_LNG * SCALE / 1000,
    z: -(lat - CENTER_LAT) * M_PER_DEG_LAT * SCALE / 1000,
  };
}
