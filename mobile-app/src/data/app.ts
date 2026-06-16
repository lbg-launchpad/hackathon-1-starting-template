import usersJson from "./users.json";
import type { AmenityId } from "@/lib/amenities";

export type RawUser = {
  id: string;
  employeeId: number;
  fullName: string;
  email: string;
  location: "London" | "Leeds" | "Edinburgh";
  team: string;
  role: string;
  lineManager: { name: string; email: string } | null;
  anchorDays: string[];
  defaultWorkingPattern: Record<string, "office" | "remote" | "off">;
  preferredNeighbourhood: string;
  deskPreferences: string[];
  bookingWindowDays: number;
  accessibilityNeeds: string | string[] | null;
};

export type AppRole = "user" | "manager" | "pa";

export type AppUser = RawUser & {
  appRole: AppRole;
  amenities: AmenityId[];
  initials: string;
  isLineManager: boolean;
  isPA: boolean;
};

const USERS = usersJson as RawUser[];

// Map the legacy preference vocabulary in users.json to our amenity IDs.
const PREF_TO_AMENITY: Record<string, AmenityId> = {
  "quiet-area": "low-noise",
  "standing-desk": "standing-desk",
  "dual-monitor": "dual-monitor",
  "accessible-desk": "wheelchair-accessible",
  "window-seat": "near-window",
  "ergonomic-chair": "ergonomic-chair",
  "soft-lighting": "soft-lighting",
  "privacy-screen": "privacy-screen",
  "near-amenities": "near-amenities",
};

function toAmenities(raw: RawUser): AmenityId[] {
  const set = new Set<AmenityId>();
  for (const p of raw.deskPreferences ?? []) {
    const m = PREF_TO_AMENITY[p];
    if (m) set.add(m);
  }
  const needs = Array.isArray(raw.accessibilityNeeds)
    ? raw.accessibilityNeeds
    : raw.accessibilityNeeds
      ? [raw.accessibilityNeeds]
      : [];
  for (const n of needs) {
    const m = PREF_TO_AMENITY[n];
    if (m) set.add(m);
  }
  return [...set];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

// Anyone who appears as a lineManager.name is considered a line manager.
const managerNames = new Set(
  USERS.map((u) => u.lineManager?.name).filter(Boolean) as string[],
);

// Mock one PA for demo purposes: pick the first "Product Manager" we find.
const paId = USERS.find((u) => u.role === "Product Manager")?.id ?? null;

function deriveAppUser(u: RawUser): AppUser {
  const isLineManager = managerNames.has(u.fullName);
  const isPA = u.id === paId;
  const appRole: AppRole = isPA ? "pa" : isLineManager ? "manager" : "user";
  return {
    ...u,
    appRole,
    amenities: toAmenities(u),
    initials: initials(u.fullName),
    isLineManager,
    isPA,
  };
}

export const APP_USERS: AppUser[] = USERS.map(deriveAppUser);
export const USER_BY_ID = Object.fromEntries(APP_USERS.map((u) => [u.id, u]));

export const DEFAULT_USER_ID =
  APP_USERS.find((u) => u.fullName === "Brandi Holloway")?.id ??
  APP_USERS[0]!.id;

export function getTeam(user: AppUser): AppUser[] {
  return APP_USERS.filter(
    (u) => u.id !== user.id && u.team === user.team && u.location === user.location,
  );
}

export function getDirectReports(user: AppUser): AppUser[] {
  if (!user.isLineManager) return [];
  return APP_USERS.filter((u) => u.lineManager?.name === user.fullName);
}

export const TEAMS = [...new Set(APP_USERS.map((u) => u.team))].sort();
export const LOCATIONS = [...new Set(APP_USERS.map((u) => u.location))].sort();
