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
}

// 13 loci per zone, in walking order.
const AUTHORED: AuthoredLocus[] = [
  // Zone 1 — Garden Court (1-13)
  { name: 'Front Gate', landmark: 'a tall wrought-iron arch', shape: 'arch', color: '#1e3a8a' },
  { name: 'Stone Fountain', landmark: 'a bubbling tiered fountain', shape: 'cylinder', color: '#38bdf8' },
  { name: 'Koi Pond', landmark: 'a round pond ringed with stones', shape: 'torus', color: '#f97316' },
  { name: 'Topiary Bear', landmark: 'a shrub clipped like a bear', shape: 'sphere', color: '#22c55e' },
  { name: 'Sundial', landmark: 'a bronze sundial on a pillar', shape: 'cone', color: '#b45309' },
  { name: 'Garden Bench', landmark: 'a long marble bench', shape: 'cube', color: '#e5e7eb' },
  { name: 'Rose Arch', landmark: 'an arch heavy with red roses', shape: 'arch', color: '#ef4444' },
  { name: 'Birdbath', landmark: 'a shallow stone birdbath', shape: 'ring', color: '#94a3b8' },
  { name: 'Greenhouse', landmark: 'a small glass greenhouse', shape: 'pyramid', color: '#a7f3d0' },
  { name: 'Garden Gnome', landmark: 'a red-hatted garden gnome', shape: 'cone', color: '#dc2626' },
  { name: 'Wishing Well', landmark: 'an old stone wishing well', shape: 'cylinder', color: '#78716c' },
  { name: 'Tulip Bed', landmark: 'a raised bed of tulips', shape: 'cube', color: '#f472b6' },
  { name: 'Side Door', landmark: 'a wooden door into the house', shape: 'arch', color: '#92400e' },

  // Zone 2 — Kitchen Wing (14-26)
  { name: 'Kitchen Sink', landmark: 'a deep ceramic farmhouse sink', shape: 'cube', color: '#e2e8f0' },
  { name: 'Copper Pot', landmark: 'a hanging copper stockpot', shape: 'cylinder', color: '#ea580c' },
  { name: 'Stove Flame', landmark: 'a gas range with a blue flame', shape: 'cone', color: '#f59e0b' },
  { name: 'Spice Rack', landmark: 'a tiered rack of spice jars', shape: 'cube', color: '#b91c1c' },
  { name: 'Fruit Bowl', landmark: 'a bowl piled with oranges', shape: 'sphere', color: '#fb923c' },
  { name: 'Rolling Pin', landmark: 'a wooden rolling pin on the counter', shape: 'cylinder', color: '#d4a373' },
  { name: 'Garlic Braid', landmark: 'a braid of garlic bulbs', shape: 'sphere', color: '#eab308' },
  { name: 'Butcher Block', landmark: 'a thick butcher’s block', shape: 'cube', color: '#a16207' },
  { name: 'Brass Kettle', landmark: 'a whistling brass kettle', shape: 'sphere', color: '#fbbf24' },
  { name: 'Apple Pie', landmark: 'a pie cooling on a rack', shape: 'cylinder', color: '#f87171' },
  { name: 'Knife Block', landmark: 'a wooden block of knives', shape: 'pyramid', color: '#57534e' },
  { name: 'Pantry Door', landmark: 'a narrow pantry doorway', shape: 'arch', color: '#7c2d12' },
  { name: 'Honey Jar', landmark: 'a golden jar of honey', shape: 'cylinder', color: '#facc15' },

  // Zone 3 — Library Hall (27-39)
  { name: 'Reading Lamp', landmark: 'a glowing brass desk lamp', shape: 'cone', color: '#fde047' },
  { name: 'Antique Globe', landmark: 'a world globe on a stand', shape: 'sphere', color: '#2563eb' },
  { name: 'Tall Bookcase', landmark: 'floor-to-ceiling shelves', shape: 'cube', color: '#78350f' },
  { name: 'Leather Chair', landmark: 'a wingback reading chair', shape: 'cube', color: '#7f1d1d' },
  { name: 'Library Ladder', landmark: 'a rolling library ladder', shape: 'cylinder', color: '#a8a29e' },
  { name: 'Marble Bust', landmark: 'a poet’s bust on a plinth', shape: 'cone', color: '#f1f5f9' },
  { name: 'Map Table', landmark: 'a table strewn with maps', shape: 'cube', color: '#ca8a04' },
  { name: 'Hourglass', landmark: 'a large sand hourglass', shape: 'cylinder', color: '#fcd34d' },
  { name: 'Chandelier', landmark: 'a crystal chandelier overhead', shape: 'torus', color: '#67e8f9' },
  { name: 'Fireplace', landmark: 'a stone hearth with embers', shape: 'cube', color: '#f97316' },
  { name: 'Quill Desk', landmark: 'a writing desk with a quill', shape: 'cube', color: '#92400e' },
  { name: 'Ship Model', landmark: 'a model galleon in a case', shape: 'pyramid', color: '#d97706' },
  { name: 'Secret Door', landmark: 'a bookcase that swings open', shape: 'arch', color: '#451a03' },

  // Zone 4 — Observatory Tower (40-52)
  { name: 'Spiral Stair', landmark: 'an iron spiral staircase', shape: 'cylinder', color: '#64748b' },
  { name: 'Telescope', landmark: 'a brass telescope on a tripod', shape: 'cone', color: '#b45309' },
  { name: 'Star Chart', landmark: 'a wall of constellation charts', shape: 'cube', color: '#1e293b' },
  { name: 'Orrery', landmark: 'a clockwork model of the planets', shape: 'torus', color: '#fbbf24' },
  { name: 'Glass Dome', landmark: 'a domed glass ceiling', shape: 'sphere', color: '#bae6fd' },
  { name: 'Compass Rose', landmark: 'a compass inlaid in the floor', shape: 'ring', color: '#c084fc' },
  { name: 'Weather Vane', landmark: 'a copper rooster vane', shape: 'cone', color: '#d97706' },
  { name: 'Pendulum', landmark: 'a long swinging pendulum', shape: 'sphere', color: '#e2e8f0' },
  { name: 'Control Panel', landmark: 'a panel of brass dials', shape: 'cube', color: '#f59e0b' },
  { name: 'Meteorite', landmark: 'a dark rock on a pedestal', shape: 'sphere', color: '#334155' },
  { name: 'Moon Globe', landmark: 'a silver model of the moon', shape: 'sphere', color: '#cbd5e1' },
  { name: 'Beacon Light', landmark: 'a rotating beacon lamp', shape: 'cylinder', color: '#fef08a' },
  { name: 'Rooftop Rail', landmark: 'a railing at the very top', shape: 'arch', color: '#a78bfa' },
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
      position: { x: origin.x + local.dx, y: 0, z: origin.z + local.dz },
    };
  });
}

export const PALACE: Locus[] = buildPalace();

export function getLocus(index: number): Locus | undefined {
  return PALACE[index - 1];
}

export const LOCI_COUNT = PALACE.length; // 52
