import type { AmenityId } from "@/lib/amenities";

export type FloorId = "ground" | "first";

export type Floor = {
  id: FloorId;
  label: string;
  shortLabel: string;
  image: string;
  // Native pixel dimensions of the floorplan image.
  width: number;
  height: number;
  zones: Zone[];
};

export type Zone = {
  id: string;
  name: string;
  // Bounding box in % of the floorplan (top-left origin).
  x: number;
  y: number;
  w: number;
  h: number;
};

export type Desk = {
  id: string;
  number: string;
  floor: FloorId;
  zone: string;
  // Position in % of the floorplan (top-left origin).
  x: number;
  y: number;
  amenities: AmenityId[];
};

export const FLOORS: Record<FloorId, Floor> = {
  ground: {
    id: "ground",
    label: "Ground floor",
    shortLabel: "G",
    image: "/floorplans/ground.png",
    width: 1448,
    height: 1086,
    zones: [
      { id: "g-window-bank", name: "Window Bank", x: 6, y: 8, w: 30, h: 24 },
      { id: "g-collab", name: "Collaboration Hub", x: 40, y: 10, w: 24, h: 22 },
      { id: "g-quiet", name: "Quiet Zone", x: 68, y: 8, w: 26, h: 28 },
      { id: "g-cafe", name: "Café Edge", x: 6, y: 38, w: 28, h: 22 },
      { id: "g-team", name: "Team Pods", x: 40, y: 38, w: 32, h: 24 },
      { id: "g-focus", name: "Focus Booths", x: 76, y: 42, w: 18, h: 22 },
      { id: "g-flex", name: "Flex Bench", x: 12, y: 68, w: 60, h: 20 },
      { id: "g-exec", name: "Exec Annex", x: 76, y: 70, w: 18, h: 18 },
    ],
  },
  first: {
    id: "first",
    label: "First floor",
    shortLabel: "1",
    image: "/floorplans/first.png",
    width: 1448,
    height: 1086,
    zones: [
      { id: "f-window-bank", name: "Window Bank", x: 6, y: 8, w: 32, h: 22 },
      { id: "f-engineering", name: "Engineering Wing", x: 42, y: 8, w: 32, h: 26 },
      { id: "f-data", name: "Data Corner", x: 78, y: 10, w: 16, h: 22 },
      { id: "f-collab", name: "Collab Room", x: 8, y: 38, w: 26, h: 22 },
      { id: "f-bench-a", name: "Bench A", x: 38, y: 40, w: 28, h: 20 },
      { id: "f-bench-b", name: "Bench B", x: 70, y: 40, w: 24, h: 20 },
      { id: "f-quiet", name: "Quiet Pods", x: 8, y: 68, w: 30, h: 22 },
      { id: "f-team", name: "Team Pods", x: 42, y: 68, w: 52, h: 22 },
    ],
  },
};

// Tiny seeded RNG so desk positions and amenities are stable across renders.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const AMENITY_POOL: AmenityId[] = [
  "low-noise",
  "dark-surface",
  "soft-lighting",
  "dual-monitor",
  "triple-monitor",
  "standing-desk",
  "near-window",
  "quiet-pod",
  "ergonomic-chair",
  "near-amenities",
  "wheelchair-accessible",
  "privacy-screen",
  "warm-area",
  "cool-area",
];

const ZONE_BASE_AMENITIES: Record<string, AmenityId[]> = {
  // Ground floor flavours
  "g-window-bank": ["near-window", "soft-lighting"],
  "g-collab": ["dual-monitor"],
  "g-quiet": ["low-noise", "quiet-pod"],
  "g-cafe": ["near-amenities"],
  "g-team": ["dual-monitor"],
  "g-focus": ["low-noise", "privacy-screen"],
  "g-flex": [],
  "g-exec": ["privacy-screen", "ergonomic-chair", "triple-monitor"],
  // First floor flavours
  "f-window-bank": ["near-window"],
  "f-engineering": ["triple-monitor", "dual-monitor"],
  "f-data": ["dual-monitor", "privacy-screen"],
  "f-collab": ["dual-monitor"],
  "f-bench-a": ["standing-desk"],
  "f-bench-b": [],
  "f-quiet": ["low-noise", "quiet-pod", "soft-lighting"],
  "f-team": ["dual-monitor", "ergonomic-chair"],
};

function generateDesks(): Desk[] {
  const desks: Desk[] = [];
  const rand = mulberry32(424242);
  let counter = 1;

  for (const floor of Object.values(FLOORS)) {
    for (const zone of floor.zones) {
      // Density: roughly 1 desk per ~120 % units of zone area, min 3 per zone.
      const area = zone.w * zone.h;
      const count = Math.max(3, Math.round(area / 110));
      // Lay out on a soft grid inside the zone.
      const cols = Math.max(2, Math.round(Math.sqrt(count * (zone.w / zone.h))));
      const rows = Math.max(2, Math.ceil(count / cols));
      let placed = 0;
      for (let r = 0; r < rows && placed < count; r++) {
        for (let c = 0; c < cols && placed < count; c++) {
          const padX = zone.w * 0.12;
          const padY = zone.h * 0.18;
          const stepX = (zone.w - padX * 2) / Math.max(1, cols - 1);
          const stepY = (zone.h - padY * 2) / Math.max(1, rows - 1);
          const jitterX = (rand() - 0.5) * Math.min(2, stepX * 0.25);
          const jitterY = (rand() - 0.5) * Math.min(2, stepY * 0.25);
          const x = zone.x + padX + stepX * c + jitterX;
          const y = zone.y + padY + stepY * r + jitterY;

          // Amenities: zone defaults plus 1-2 random from pool.
          const base = [...(ZONE_BASE_AMENITIES[zone.id] ?? [])];
          const extras = 1 + Math.floor(rand() * 2);
          for (let i = 0; i < extras; i++) {
            const pick = AMENITY_POOL[Math.floor(rand() * AMENITY_POOL.length)]!;
            if (!base.includes(pick)) base.push(pick);
          }
          // Sprinkle accessibility coverage: ~1 in 8 desks is wheelchair-accessible.
          if (rand() < 0.12 && !base.includes("wheelchair-accessible")) {
            base.push("wheelchair-accessible");
          }

          desks.push({
            id: `${floor.id}-${counter}`,
            number: `${floor.shortLabel}-${String(counter).padStart(3, "0")}`,
            floor: floor.id,
            zone: zone.id,
            x,
            y,
            amenities: base,
          });
          counter++;
          placed++;
        }
      }
    }
  }
  return desks;
}

export const DESKS: Desk[] = generateDesks();
export const DESKS_BY_FLOOR: Record<FloorId, Desk[]> = {
  ground: DESKS.filter((d) => d.floor === "ground"),
  first: DESKS.filter((d) => d.floor === "first"),
};
export const DESK_BY_ID: Record<string, Desk> = Object.fromEntries(
  DESKS.map((d) => [d.id, d]),
);

export function desksMatchingAmenities(
  desks: Desk[],
  amenities: AmenityId[],
): Desk[] {
  if (amenities.length === 0) return desks;
  return desks.filter((d) => amenities.every((a) => d.amenities.includes(a)));
}

// Buildings and their floor sets per Lloyds location. We reuse the two
// floorplan PNGs across cities, varying which floors are shown so the
// location selector is meaningful in the UI.
export type LocationId = "London" | "Leeds" | "Edinburgh";

export type Building = {
  id: string;
  city: LocationId;
  name: string;
  address: string;
  floorIds: FloorId[];
};

export const BUILDINGS_BY_LOCATION: Record<LocationId, Building> = {
  London: {
    id: "london-gresham",
    city: "London",
    name: "Gresham St HQ",
    address: "25 Gresham St, London EC2V 7HN",
    floorIds: ["ground", "first"],
  },
  Leeds: {
    id: "leeds-blackbull",
    city: "Leeds",
    name: "Black Bull St",
    address: "Black Bull St, Leeds LS10 1HG",
    floorIds: ["ground"],
  },
  Edinburgh: {
    id: "edinburgh-fountainbridge",
    city: "Edinburgh",
    name: "Fountainbridge",
    address: "The Mound, Edinburgh EH1 1YZ",
    floorIds: ["first"],
  },
};
