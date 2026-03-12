export interface Vec2 {
  x: number;
  z: number;
}

export interface GraphNode {
  x: number;
  z: number;
  edges: number[];
}

export interface GraphEdge {
  from: number;
  to: number;
  pts: Vec2[];
  len: number;
  name: string;
  type: RoadType;
}

export type RoadType =
  | 'motorway'
  | 'trunk'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'residential'
  | 'service'
  | 'footway'
  | 'cycleway'
  | 'pedestrian'
  | 'living_street'
  | 'unclassified';

export interface RoadData {
  name: string;
  type: string;
  points: [number, number][]; // [lat, lng][]
}

export interface RoadFile {
  generated: string;
  bounds: { south: number; north: number; west: number; east: number };
  stats: { nodes: number; roads: number };
  roads: RoadData[];
}

export interface VehicleConfig {
  id: string;
  name: string;
  maxSpeed: number;
  altitude: number;
  camDist: number;
  camHeight: number;
  bobAmp: number;
  bobFreq: number;
}

export interface PlayerState {
  currentEdge: number;
  progress: number;
  direction: 1 | -1;
  speed: number;
  vehicleIndex: number;
  totalDistance: number;
}

export interface InputState {
  forward: boolean;
  left: boolean;
  right: boolean;
  dragX: number;
  dragY: number;
  dragging: boolean;
}
