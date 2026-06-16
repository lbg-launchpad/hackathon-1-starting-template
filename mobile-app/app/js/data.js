// Data layer: users loaded from /data/users.json (one level up); desks generated
// per floor with realistic amenities; in-memory + localStorage persistence.

const STORAGE_KEY = "spaces-lbg-v1";

// --- Amenity catalog ---------------------------------------------------------
export const AMENITIES = {
  "low-noise":            { label: "Low noise",            icon: "volume-low" },
  "dark-surface":         { label: "Dark surface",         icon: "moon" },
  "soft-lighting":        { label: "Soft lighting",        icon: "sun" },
  "dual-monitor":         { label: "Dual monitor",         icon: "monitor" },
  "triple-monitor":       { label: "Triple monitor",       icon: "monitors" },
  "standing-desk":        { label: "Standing desk",        icon: "stand" },
  "near-window":          { label: "Near window",          icon: "window" },
  "quiet-pod":            { label: "Quiet pod",            icon: "shield" },
  "ergonomic-chair":      { label: "Ergonomic chair",      icon: "chair" },
  "near-amenities":       { label: "Near kitchen",         icon: "coffee" },
  "wheelchair-accessible":{ label: "Step-free access",     icon: "accessible" },
  "privacy-screen":       { label: "Privacy screen",       icon: "eye-off" },
  "warm-area":            { label: "Warm area",            icon: "flame" },
  "cool-area":            { label: "Cool area",            icon: "snow" },
};

export const AMENITY_KEYS = Object.keys(AMENITIES);

// --- Locations + floors ------------------------------------------------------
export const LOCATIONS = [
  { id: "london",    name: "London — Gresham Street" },
  { id: "edinburgh", name: "Edinburgh — The Mound" },
  { id: "leeds",     name: "Leeds — Lovell Park" },
  { id: "bristol",   name: "Bristol — Canon's Marsh" },
];

export const FLOORS = [
  { id: "ground", name: "Ground floor", image: "../floorplans/ground.png" },
  { id: "first",  name: "First floor",  image: "../floorplans/first.png"  },
];

// --- Deterministic PRNG so desk layout is stable across reloads --------------
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ZONES = ["Window Bank", "Quiet Zone", "Collab Hub", "Sunny Side", "Central"];

function buildDesks(floorId, locationId, count, seed) {
  const rng = mulberry32(seed);
  const desks = [];
  // Place dots in a few clusters across the floor (percentages of image area).
  const clusters = [
    { cx: 0.22, cy: 0.30, rx: 0.10, ry: 0.13, zone: "Window Bank" },
    { cx: 0.52, cy: 0.28, rx: 0.12, ry: 0.10, zone: "Sunny Side" },
    { cx: 0.78, cy: 0.32, rx: 0.10, ry: 0.13, zone: "Collab Hub" },
    { cx: 0.24, cy: 0.66, rx: 0.10, ry: 0.13, zone: "Quiet Zone" },
    { cx: 0.55, cy: 0.66, rx: 0.13, ry: 0.10, zone: "Central" },
    { cx: 0.80, cy: 0.66, rx: 0.10, ry: 0.13, zone: "Quiet Zone" },
  ];

  for (let i = 0; i < count; i++) {
    const cluster = clusters[i % clusters.length];
    // Lay desks out in a small grid inside each cluster.
    const inClusterIdx = Math.floor(i / clusters.length);
    const gridCols = 4;
    const gx = inClusterIdx % gridCols;
    const gy = Math.floor(inClusterIdx / gridCols);
    const px = cluster.cx + (gx - gridCols / 2 + 0.5) * (cluster.rx * 0.45);
    const py = cluster.cy + (gy - 0.5) * (cluster.ry * 0.55);

    // Build amenity mix per zone with some randomness.
    const baseAmenities = {
      "Window Bank": ["near-window", "soft-lighting", "dual-monitor"],
      "Quiet Zone":  ["low-noise", "quiet-pod", "ergonomic-chair"],
      "Collab Hub":  ["triple-monitor", "near-amenities", "standing-desk"],
      "Sunny Side":  ["near-window", "warm-area", "dual-monitor"],
      "Central":     ["dual-monitor", "ergonomic-chair", "near-amenities"],
    }[cluster.zone];

    const extra = [];
    if (rng() < 0.18) extra.push("wheelchair-accessible");
    if (rng() < 0.25) extra.push("standing-desk");
    if (rng() < 0.2)  extra.push("privacy-screen");
    if (rng() < 0.15) extra.push("dark-surface");
    if (rng() < 0.2)  extra.push("cool-area");

    const amenities = Array.from(new Set([...baseAmenities, ...extra]));

    const floorPrefix = floorId === "ground" ? "G" : "1";
    const number = `${floorPrefix}${String(i + 1).padStart(3, "0")}`;

    desks.push({
      id: `${locationId}-${floorId}-${number}`,
      number,
      floorId,
      locationId,
      zone: cluster.zone,
      x: px,
      y: py,
      amenities,
    });
  }
  return desks;
}

// --- Load users + build derived data ----------------------------------------
async function loadUsers() {
  const res = await fetch("../data/users.json");
  if (!res.ok) throw new Error("Failed to load users.json");
  return res.json();
}

function inferLocationId(loc) {
  const key = (loc || "").toLowerCase();
  if (key.includes("london")) return "london";
  if (key.includes("edinburgh")) return "edinburgh";
  if (key.includes("leeds")) return "leeds";
  if (key.includes("bristol")) return "bristol";
  return "london";
}

export async function bootstrapData() {
  const raw = await loadUsers();
  const users = raw.map((u) => ({
    id: u.id,
    employeeId: u.employeeId,
    name: u.fullName,
    email: u.email,
    location: inferLocationId(u.location),
    team: u.team,
    role: u.role,
    manager: u.lineManager?.name,
    preferences: u.deskPreferences || [],
    accessibility: u.accessibilityNeeds,
    initials: u.fullName.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase(),
  }));

  // Build desks for each (location, floor) — ~36 desks per floor.
  const desks = [];
  let seed = 1234;
  for (const loc of LOCATIONS) {
    for (const floor of FLOORS) {
      seed += 1;
      desks.push(...buildDesks(floor.id, loc.id, 36, seed));
    }
  }

  return { users, desks };
}

// --- State + persistence -----------------------------------------------------
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore */ }
  return {
    currentUserId: null,
    theme: "light",
    bookings: [], // { id, userId, deskId, date, startMin, endMin, label, checkedIn, status, teamFor }
    preferences: {
      autoCheckIn: false,
      pushNotifications: true,
      emailNotifications: true,
      myDeskNeeds: [],
    },
    lastLocation: "london",
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) { /* quota */ }
}
