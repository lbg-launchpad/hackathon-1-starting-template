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

// Explicit desk positions per floor — coordinates are fractions of the
// floor-plan image (x: 0 = left, 1 = right; y: 0 = top, 1 = bottom). Each
// entry should sit directly over a desk drawn on the plan.
function gridPositions({ cols, rows, x0, x1, y0, y1, zone }) {
  const out = [];
  const dx = cols === 1 ? 0 : (x1 - x0) / (cols - 1);
  const dy = rows === 1 ? 0 : (y1 - y0) / (rows - 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({ x: x0 + c * dx, y: y0 + r * dy, zone });
    }
  }
  return out;
}

const DESK_POSITIONS_BY_FLOOR = {
  ground: [
    // WINDOWS row across the top
    ...gridPositions({ cols: 6, rows: 1, x0: 0.105, x1: 0.265, y0: 0.105, y1: 0.105, zone: "Window Bank" }),
    // SECURITY block top-right (2 cols × 4 rows)
    ...gridPositions({ cols: 2, rows: 4, x0: 0.745, x1: 0.835, y0: 0.080, y1: 0.205, zone: "Sunny Side" }),
    // VIRTUALISATION column mid-left (2 cols × 3 rows)
    ...gridPositions({ cols: 2, rows: 3, x0: 0.075, x1: 0.170, y0: 0.310, y1: 0.480, zone: "Quiet Zone" }),
    // Bottom-left desks (2 cols × 2 rows)
    ...gridPositions({ cols: 2, rows: 2, x0: 0.075, x1: 0.170, y0: 0.620, y1: 0.720, zone: "Collab Hub" }),
    // SUPPORT block right (3 cols × 4 rows)
    ...gridPositions({ cols: 3, rows: 4, x0: 0.710, x1: 0.880, y0: 0.500, y1: 0.770, zone: "Central" }),
  ],
  first: [
    // Top-left desk block
    ...gridPositions({ cols: 3, rows: 2, x0: 0.085, x1: 0.225, y0: 0.110, y1: 0.225, zone: "Window Bank" }),
    // Top-right desk block (SECURITY-equivalent)
    ...gridPositions({ cols: 3, rows: 2, x0: 0.745, x1: 0.890, y0: 0.110, y1: 0.225, zone: "Sunny Side" }),
    // Mid-left desk column
    ...gridPositions({ cols: 2, rows: 3, x0: 0.085, x1: 0.180, y0: 0.330, y1: 0.520, zone: "Quiet Zone" }),
    // Mid-right desk column
    ...gridPositions({ cols: 2, rows: 3, x0: 0.785, x1: 0.880, y0: 0.330, y1: 0.520, zone: "Central" }),
    // Bottom-left desk block
    ...gridPositions({ cols: 3, rows: 2, x0: 0.085, x1: 0.225, y0: 0.640, y1: 0.760, zone: "Collab Hub" }),
    // Bottom-right desk block
    ...gridPositions({ cols: 3, rows: 2, x0: 0.745, x1: 0.890, y0: 0.640, y1: 0.760, zone: "Quiet Zone" }),
  ],
};

const ZONE_BASE_AMENITIES = {
  "Window Bank": ["near-window", "soft-lighting", "dual-monitor"],
  "Quiet Zone":  ["low-noise", "quiet-pod", "ergonomic-chair"],
  "Collab Hub":  ["triple-monitor", "near-amenities", "standing-desk"],
  "Sunny Side":  ["near-window", "warm-area", "dual-monitor"],
  "Central":     ["dual-monitor", "ergonomic-chair", "near-amenities"],
};

function buildDesks(floorId, locationId, _count, seed) {
  const rng = mulberry32(seed);
  const positions = DESK_POSITIONS_BY_FLOOR[floorId] || DESK_POSITIONS_BY_FLOOR.ground;
  const floorPrefix = floorId === "ground" ? "G" : "1";

  return positions.map((p, i) => {
    const extra = [];
    if (rng() < 0.18) extra.push("wheelchair-accessible");
    if (rng() < 0.25) extra.push("standing-desk");
    if (rng() < 0.2)  extra.push("privacy-screen");
    if (rng() < 0.15) extra.push("dark-surface");
    if (rng() < 0.2)  extra.push("cool-area");
    const amenities = Array.from(new Set([...ZONE_BASE_AMENITIES[p.zone], ...extra]));
    const number = `${floorPrefix}${String(i + 1).padStart(3, "0")}`;
    return {
      id: `${locationId}-${floorId}-${number}`,
      number,
      floorId,
      locationId,
      zone: p.zone,
      x: p.x,
      y: p.y,
      amenities,
    };
  });
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
    workdayIsPA: !!u.isPA,
    workdayAnchorDays: Array.isArray(u.anchorDays) ? u.anchorDays : [],
    workdayWorkingPattern: u.defaultWorkingPattern || {},
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
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge defaults so old localStorage entries pick up new fields.
      parsed.preferences = { ...defaultPreferences(), ...(parsed.preferences || {}) };
      parsed.waitlist = parsed.waitlist || [];
      return parsed;
    }
  } catch (_) { /* ignore */ }
  return defaultState();
}

export function defaultState() {
  return {
    currentUserId: null,
    theme: "light",
    bookings: [], // { id, userId, deskId, date, startMin, endMin, label, checkedIn, status, teamFor }
    waitlist: [], // { id, userId, locationId, floorId, date, createdAt, notified }
    preferences: defaultPreferences(),
    lastLocation: "london",
  };
}

export function defaultPreferences() {
  return {
    autoCheckIn: false,
    pushNotifications: true,
    emailNotifications: true,
    myDeskNeeds: [],
    // Editable profile fields (overlay onto the Workday user record)
    displayName: "",
    pronouns: "",
    phone: "",
    bio: "",
    avatarDataUrl: "",
    anchorDays: [],          // e.g. ["Monday", "Wednesday"]
    workingPattern: {},      // e.g. { monday: "office", tuesday: "remote", ... }
    preferredLocation: "",   // one of LOCATIONS[].id; "" = use Workday location
    isPA: false,             // year-ahead booking horizon
  };
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_) { /* quota */ }
}
