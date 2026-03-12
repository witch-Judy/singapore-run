import { VEHICLES, LANDMARKS } from '../config';
import { latLngToWorld } from '../map/projection';
import type { PlayerState } from '../types';

const landmarkPositions = LANDMARKS.map(l => ({
  name: l.name,
  ...latLngToWorld(l.lat, l.lng),
}));

export function initHUD(): void {
  const bar = document.getElementById('vehicle-bar')!;
  VEHICLES.forEach((v, i) => {
    const btn = document.createElement('button');
    btn.className = 'vehicle-btn' + (i === 0 ? ' active' : '');
    btn.textContent = `${i + 1}`;
    btn.title = v.name;
    btn.dataset.index = String(i);
    bar.appendChild(btn);
  });

  // Vehicle switch via keyboard
  window.addEventListener('keydown', (e) => {
    const n = parseInt(e.key);
    if (n >= 1 && n <= VEHICLES.length) {
      window.dispatchEvent(new CustomEvent('vehicle-switch', { detail: n - 1 }));
    }
  });

  // Vehicle switch via button click
  bar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.vehicle-btn') as HTMLElement;
    if (btn) {
      window.dispatchEvent(new CustomEvent('vehicle-switch', { detail: parseInt(btn.dataset.index!) }));
    }
  });
}

export function updateHUD(player: PlayerState, roadName: string, x: number, z: number): void {
  const speedEl = document.getElementById('speed')!;
  const roadEl = document.getElementById('road-name')!;
  const distEl = document.getElementById('distance')!;

  const kmh = (player.speed * 120).toFixed(0); // rough scaling
  speedEl.textContent = `${kmh} km/h`;
  distEl.textContent = `${(player.totalDistance / 100).toFixed(1)} km`;

  // Road name + nearby landmark
  let label = roadName || '';
  for (const lm of landmarkPositions) {
    const dx = lm.x - x;
    const dz = lm.z - z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist < 30) {
      label = `${lm.name}${roadName ? ' · ' + roadName : ''}`;
      break;
    }
  }
  roadEl.textContent = label;

  // Update vehicle bar active state
  const btns = document.querySelectorAll('.vehicle-btn');
  btns.forEach((btn, i) => {
    btn.classList.toggle('active', i === player.vehicleIndex);
  });
}
