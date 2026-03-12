import type { RoadFile } from '../types';

export async function loadRoadData(): Promise<RoadFile> {
  const resp = await fetch('./data/sg-roads.json');
  if (!resp.ok) throw new Error(`Failed to load road data: ${resp.status}`);
  return resp.json();
}
