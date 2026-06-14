import type { Locus, LocusShape, ZoneId } from '../types';
import { ZONES } from './zones';

// The shared 52-location palace. Hand-authored, fixed, and identical for every
// user. Familiarity with this one strong palace is the whole point — users
// never create or edit palaces, only the private content they place inside it.
//
// Four zones of 13 loci (52 total) are walked strictly in index order. Names,
// landmarks, shapes and colours are authored here; positions are produced by a
// deterministic serpentine layout (below) so every locus is clearly spaced from
// its neighbours along a single unambiguous route.

interface AuthoredLocus {
  name: string;
  landmark: string;
  shape: LocusShape;
  color: string;
  model: string; // GLB slug in /public/models
}

// 13 loci per zone, in walking order. Each maps to a real CC0 KayKit model so
// every stop is a recognisable object you can picture and "place" things on.
const AUTHORED: AuthoredLocus[] = [
  // Zone 1 — Town Square (1-13)
  { name: 'Street Lamp', landmark: 'a tall iron street lamp', shape: 'cylinder', color: '#1e3a8a', model: 'lamp' },
  { name: 'Park Bench', landmark: 'a long wooden park bench', shape: 'cube', color: '#38bdf8', model: 'bench' },
  { name: 'Hedge Bush', landmark: 'a rounded green hedge', shape: 'sphere', color: '#22c55e', model: 'bush' },
  { name: 'Fire Hydrant', landmark: 'a red fire hydrant', shape: 'cylinder', color: '#ef4444', model: 'hydrant' },
  { name: 'Water Tower', landmark: 'a tall water tower', shape: 'cylinder', color: '#b45309', model: 'watertower' },
  { name: 'Dumpster', landmark: 'a big metal dumpster', shape: 'cube', color: '#16a34a', model: 'dumpster' },
  { name: 'Traffic Light', landmark: 'a set of traffic lights', shape: 'cylinder', color: '#facc15', model: 'trafficlight' },
  { name: 'Trash Can', landmark: 'a public trash can', shape: 'cylinder', color: '#94a3b8', model: 'trashcan' },
  { name: 'Wooden Crate', landmark: 'a stack of wooden crates', shape: 'cube', color: '#a16207', model: 'crate' },
  { name: 'Taxi Cab', landmark: 'a yellow taxi cab', shape: 'cube', color: '#eab308', model: 'taxi' },
  { name: 'Police Car', landmark: 'a parked police car', shape: 'cube', color: '#1d4ed8', model: 'police' },
  { name: 'Corner Shop', landmark: 'a small corner shop', shape: 'cube', color: '#0ea5e9', model: 'shop' },
  { name: 'Clock Tower', landmark: 'a tall clock tower', shape: 'cube', color: '#6366f1', model: 'clocktower' },

  // Zone 2 — The Kitchen (14-26)
  { name: 'Range Hood', landmark: 'a steel extractor hood', shape: 'cube', color: '#e2e8f0', model: 'hood' },
  { name: 'Cutting Board', landmark: 'a wooden cutting board', shape: 'cube', color: '#d4a373', model: 'board' },
  { name: 'Dish Rack', landmark: 'a rack of clean plates', shape: 'cube', color: '#cbd5e1', model: 'dishrack' },
  { name: 'Kitchen Chair', landmark: 'a simple kitchen chair', shape: 'cube', color: '#b91c1c', model: 'kchair' },
  { name: 'Carrot Crate', landmark: 'a crate of carrots', shape: 'cube', color: '#fb923c', model: 'carrots' },
  { name: 'Tomato Crate', landmark: 'a crate of tomatoes', shape: 'cube', color: '#ef4444', model: 'tomatoes' },
  { name: 'Cheese Crate', landmark: 'a crate of cheese wheels', shape: 'cube', color: '#eab308', model: 'cheese' },
  { name: 'Burger Plate', landmark: 'a plated burger', shape: 'cylinder', color: '#a16207', model: 'burger' },
  { name: 'Pot of Stew', landmark: 'a steaming pot of stew', shape: 'cylinder', color: '#f59e0b', model: 'stew' },
  { name: 'Soup Bowl', landmark: 'a full soup bowl', shape: 'sphere', color: '#fbbf24', model: 'bowl' },
  { name: 'Ham Crate', landmark: 'a crate of ham', shape: 'cube', color: '#f87171', model: 'ham' },
  { name: 'Potato Crate', landmark: 'a crate of potatoes', shape: 'cube', color: '#a8a29e', model: 'potatoes' },
  { name: 'Onion Crate', landmark: 'a crate of onions', shape: 'cube', color: '#facc15', model: 'onions' },

  // Zone 3 — The Old Crypt (27-39)
  { name: 'Long Table', landmark: 'a long wooden table', shape: 'cube', color: '#78350f', model: 'table' },
  { name: 'Wooden Chair', landmark: 'a sturdy wooden chair', shape: 'cube', color: '#7f1d1d', model: 'cchair' },
  { name: 'Treasure Chest', landmark: 'a heavy treasure chest', shape: 'cube', color: '#ca8a04', model: 'chest' },
  { name: 'Wall Torch', landmark: 'a burning wall torch', shape: 'cone', color: '#f97316', model: 'torch' },
  { name: 'Candelabra', landmark: 'a three-armed candelabra', shape: 'cylinder', color: '#fde047', model: 'candelabra' },
  { name: 'Large Barrel', landmark: 'a big wooden barrel', shape: 'cylinder', color: '#92400e', model: 'barrel' },
  { name: 'Green Bottle', landmark: 'a tall green bottle', shape: 'cylinder', color: '#16a34a', model: 'bottle' },
  { name: 'Large Crate', landmark: 'a large storage crate', shape: 'cube', color: '#a16207', model: 'bigcrate' },
  { name: 'Stone Pillar', landmark: 'a carved stone pillar', shape: 'cylinder', color: '#a8a29e', model: 'pillar' },
  { name: 'Red Banner', landmark: 'a hanging red banner', shape: 'cube', color: '#dc2626', model: 'banner' },
  { name: 'Sword & Shield', landmark: 'a sword resting on a shield', shape: 'cube', color: '#9ca3af', model: 'swordshield' },
  { name: 'Ring of Keys', landmark: 'a heavy ring of keys', shape: 'ring', color: '#fcd34d', model: 'keys' },
  { name: 'Old Bed', landmark: 'an old decorated bed', shape: 'cube', color: '#451a03', model: 'bed' },

  // Zone 4 — Space Base (40-52)
  { name: 'Habitat Module', landmark: 'a domed habitat module', shape: 'sphere', color: '#64748b', model: 'habitat' },
  { name: 'Cargo Pod', landmark: 'a sealed cargo pod', shape: 'cube', color: '#b45309', model: 'cargo' },
  { name: 'Cargo Depot', landmark: 'a stacked cargo depot', shape: 'cube', color: '#1e293b', model: 'depot' },
  { name: 'Container Stack', landmark: 'a stack of containers', shape: 'cube', color: '#fbbf24', model: 'containers' },
  { name: 'Drill Rig', landmark: 'a mining drill rig', shape: 'cylinder', color: '#bae6fd', model: 'drill' },
  { name: 'Lander', landmark: 'a four-legged lander', shape: 'cone', color: '#c084fc', model: 'lander' },
  { name: 'Landing Pad', landmark: 'a marked landing pad', shape: 'cylinder', color: '#d97706', model: 'pad' },
  { name: 'Solar Panel', landmark: 'a tilted solar panel', shape: 'cube', color: '#e2e8f0', model: 'solar' },
  { name: 'Space Truck', landmark: 'a rugged space truck', shape: 'cube', color: '#f59e0b', model: 'truck' },
  { name: 'Wind Turbine', landmark: 'a tall wind turbine', shape: 'cylinder', color: '#334155', model: 'turbine' },
  { name: 'Moon Rock', landmark: 'a large grey moon rock', shape: 'sphere', color: '#cbd5e1', model: 'moonrock' },
  { name: 'Tall Spire', landmark: 'a tall metal spire', shape: 'cone', color: '#fef08a', model: 'spire' },
  { name: 'Solar Array', landmark: 'a roof of solar panels', shape: 'cube', color: '#a78bfa', model: 'array' },
];

// Serpentine offsets within a zone's square area (local x/z, metres from the
// zone origin). A single snaking path of 13 stops with generous spacing so no
// two neighbours are ever confused.
const COLS = [4, 14, 24, 32];
const ROWS = [4, 14, 24, 32];
const SERPENTINE: Array<{ dx: number; dz: number }> = [
  { dx: COLS[0], dz: ROWS[0] },
  { dx: COLS[1], dz: ROWS[0] },
  { dx: COLS[2], dz: ROWS[0] },
  { dx: COLS[3], dz: ROWS[0] },
  { dx: COLS[3], dz: ROWS[1] },
  { dx: COLS[2], dz: ROWS[1] },
  { dx: COLS[1], dz: ROWS[1] },
  { dx: COLS[0], dz: ROWS[1] },
  { dx: COLS[0], dz: ROWS[2] },
  { dx: COLS[1], dz: ROWS[2] },
  { dx: COLS[2], dz: ROWS[2] },
  { dx: COLS[3], dz: ROWS[2] },
  { dx: COLS[3], dz: ROWS[3] },
];

function buildPalace(): Locus[] {
  return AUTHORED.map((a, i) => {
    const index = i + 1;
    const zone = (Math.floor(i / 13) + 1) as ZoneId;
    const local = SERPENTINE[i % 13];
    const origin = ZONES[zone].origin;
    return {
      index,
      zone,
      name: a.name,
      landmark: a.landmark,
      shape: a.shape,
      color: a.color,
      model: a.model,
      position: { x: origin.x + local.dx, y: 0, z: origin.z + local.dz },
    };
  });
}

export const PALACE: Locus[] = buildPalace();

export function getLocus(index: number): Locus | undefined {
  return PALACE[index - 1];
}

export const LOCI_COUNT = PALACE.length; // 52
