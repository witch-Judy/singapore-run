import type { VehicleConfig } from './types';

// Colors
export const BG_COLOR = 0x060610;
export const ACCENT_COLOR = 0x00FFC8;
export const ACCENT_HEX = '#00FFC8';

// Projection
export const CENTER_LAT = 1.290;
export const CENTER_LNG = 103.852;
export const SCALE = 9000;

// Physics
export const ACCELERATION = 0.008;
export const FRICTION = 0.92;
export const NODE_MERGE_RESOLUTION = 0.4;

// Road rendering — brighter colors, glow on all types
export const ROAD_SPECS: Record<string, { width: number; color: number; edgeGlow: number; dashes: boolean }> = {
  motorway: { width: 7, color: 0x4a4a6a, edgeGlow: 0xFF6644, dashes: true },
  trunk:    { width: 6, color: 0x454565, edgeGlow: 0xFF8844, dashes: true },
  primary:  { width: 5, color: 0x404060, edgeGlow: 0xFFAA44, dashes: true },
  secondary:{ width: 3.5, color: 0x3a3a58, edgeGlow: 0x44AAFF, dashes: false },
  tertiary: { width: 2.8, color: 0x353555, edgeGlow: 0x44FFAA, dashes: false },
  residential: { width: 2.0, color: 0x303050, edgeGlow: 0x335566, dashes: false },
  service:  { width: 1.5, color: 0x2a2a48, edgeGlow: 0x2a3344, dashes: false },
  footway:  { width: 0.8, color: 0x252542, edgeGlow: 0x223344, dashes: false },
  cycleway: { width: 0.8, color: 0x252542, edgeGlow: 0x224433, dashes: false },
  pedestrian: { width: 1.0, color: 0x282845, edgeGlow: 0x223344, dashes: false },
  living_street: { width: 1.8, color: 0x2c2c4a, edgeGlow: 0x334455, dashes: false },
  unclassified: { width: 2.0, color: 0x303050, edgeGlow: 0x334455, dashes: false },
};

// Vehicles
export const VEHICLES: VehicleConfig[] = [
  { id: 'runner',  name: 'Runner',  maxSpeed: 0.30, altitude: 0,  camDist: 7,  camHeight: 3,   bobAmp: 0.10, bobFreq: 9  },
  { id: 'scooter', name: 'Scooter', maxSpeed: 0.52, altitude: 0,  camDist: 9,  camHeight: 3.5, bobAmp: 0.03, bobFreq: 13 },
  { id: 'bird',    name: 'Eagle',   maxSpeed: 0.72, altitude: 12, camDist: 12, camHeight: 7,   bobAmp: 0.28, bobFreq: 3  },
  { id: 'milo',    name: 'Milo',    maxSpeed: 0.38, altitude: 0,  camDist: 12, camHeight: 5,   bobAmp: 0.16, bobFreq: 4  },
  { id: 'rocket',  name: 'Rocket',  maxSpeed: 1.00, altitude: 20, camDist: 14, camHeight: 9,   bobAmp: 0.06, bobFreq: 15 },
];

// Landmarks
export const LANDMARKS = [
  { name: 'Marina Bay Sands',    lat: 1.2834, lng: 103.8607 },
  { name: 'Gardens by the Bay',  lat: 1.2816, lng: 103.8636 },
  { name: 'Merlion Park',        lat: 1.2868, lng: 103.8545 },
  { name: 'Raffles Place',       lat: 1.2903, lng: 103.8520 },
  { name: 'Orchard Road',        lat: 1.3010, lng: 103.8415 },
  { name: 'Clarke Quay',         lat: 1.2895, lng: 103.8450 },
  { name: 'Chinatown',           lat: 1.2835, lng: 103.8445 },
  { name: 'Fort Canning',        lat: 1.2940, lng: 103.8465 },
];
