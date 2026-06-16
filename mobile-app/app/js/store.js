// Central app store. Keeps mutable runtime state, exposes pure-ish helpers,
// and persists user-facing slices (bookings, preferences, theme) to localStorage.

import { loadState, saveState } from "./data.js";

const listeners = new Set();

export const TIME_SLOTS = {
  day:       { label: "All day",    startMin: 9 * 60,  endMin: 17 * 60 + 30 },
  morning:   { label: "Morning",    startMin: 9 * 60,  endMin: 12 * 60 + 30 },
  afternoon: { label: "Afternoon",  startMin: 13 * 60, endMin: 17 * 60 + 30 },
  custom:    { label: "Custom",     startMin: 10 * 60, endMin: 15 * 60 },
};

const state = {
  // hydrated
  ...loadState(),
  // runtime only
  users: [],
  desks: [],
  // booking flow scratch state
  bookingDraft: {
    locationId: null,
    floorId: "ground",
    date: todayISO(),
    slotKey: "day",
    customStart: TIME_SLOTS.custom.startMin,
    customEnd: TIME_SLOTS.custom.endMin,
    selectedDeskId: null,
    forTeam: false,
    teammates: [], // user ids
    teamDeskMap: {}, // userId -> deskId
    amenityFilters: [],
  },
};

export function getState() { return state; }
export function currentUser() {
  return state.users.find((u) => u.id === state.currentUserId) || state.users[0] || null;
}
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export function notify() { listeners.forEach((fn) => { try { fn(state); } catch (e) { console.error(e); } }); }

export function hydrate({ users, desks }) {
  state.users = users;
  state.desks = desks;
  if (!state.currentUserId && users.length) {
    state.currentUserId = users[0].id;
    state.bookingDraft.locationId = users[0].location;
    state.lastLocation = users[0].location;
  }
  if (!state.bookingDraft.locationId) state.bookingDraft.locationId = state.lastLocation || "london";
  seedDemo();
  persist();
}

// One-off demo seed: gives the user a booking today + a couple of teammate
// bookings so the home/team/floor-plan pages have something to show.
function seedDemo() {
  if (localStorage.getItem("spaces-lbg-seeded") === "1") return;
  if (state.bookings.length) { localStorage.setItem("spaces-lbg-seeded", "1"); return; }
  const me = state.users.find((u) => u.id === state.currentUserId);
  if (!me) return;
  const today = todayISO();
  const desksHere = state.desks.filter((d) => d.locationId === me.location && d.floorId === "ground");
  if (!desksHere.length) { localStorage.setItem("spaces-lbg-seeded", "1"); return; }
  // me: today, morning
  state.bookings.push({
    id: "seed-me", userId: me.id, deskId: desksHere[2].id, date: today,
    startMin: 9 * 60, endMin: 12 * 60 + 30, label: "Morning",
    checkedIn: false, status: "confirmed", createdAt: new Date().toISOString(),
  });
  // a couple of teammates: today, all day
  const teammates = state.users.filter((u) => u.team === me.team && u.id !== me.id).slice(0, 3);
  teammates.forEach((t, i) => {
    state.bookings.push({
      id: "seed-t" + i, userId: t.id, deskId: desksHere[6 + i * 2]?.id || desksHere[i].id, date: today,
      startMin: 9 * 60, endMin: 17 * 60 + 30, label: "All day",
      checkedIn: i === 0, status: "confirmed", createdAt: new Date().toISOString(),
    });
  });
  localStorage.setItem("spaces-lbg-seeded", "1");
}

export function persist() {
  saveState({
    currentUserId: state.currentUserId,
    theme: state.theme,
    bookings: state.bookings,
    preferences: state.preferences,
    lastLocation: state.lastLocation,
  });
}

export function update(mutator) {
  mutator(state);
  persist();
  notify();
}

export function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export function fmtTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h < 12 ? "am" : "pm";
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${m === 0 ? "" : ":" + String(m).padStart(2, "0")}${ampm}`;
}

export function fmtDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

export function deskById(id) { return state.desks.find((d) => d.id === id); }
export function userById(id) { return state.users.find((u) => u.id === id); }

// Bookings that overlap a given date+time range on a specific desk
export function bookingsOnDesk(deskId, date) {
  return state.bookings.filter((b) => b.deskId === deskId && b.date === date && b.status !== "cancelled");
}

export function deskOccupantOn(deskId, date) {
  const booking = bookingsOnDesk(deskId, date)[0];
  if (!booking) return null;
  return userById(booking.userId);
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function deskIsFreeFor({ deskId, date, startMin, endMin }) {
  return !state.bookings.some(
    (b) =>
      b.deskId === deskId &&
      b.date === date &&
      b.status !== "cancelled" &&
      rangesOverlap(b.startMin, b.endMin, startMin, endMin)
  );
}

export function genBookingId() {
  return "bk-" + Math.random().toString(36).slice(2, 9);
}
