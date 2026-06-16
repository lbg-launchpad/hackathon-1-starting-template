import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { APP_USERS, DEFAULT_USER_ID, USER_BY_ID, type AppUser } from "@/data/app";
import { DESK_BY_ID } from "@/data/desks";
import type { AmenityId } from "@/lib/amenities";

export type BookingType = "desk" | "room";
export type BookingStatus = "confirmed" | "requested" | "cancelled";

export type Booking = {
  id: string;
  userId: string;
  bookedByUserId?: string;
  type: BookingType;
  deskId?: string;
  roomId?: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  location?: string;
  status: BookingStatus;
  checkedInAt?: string; // ISO timestamp
  checkedOutAt?: string; // ISO timestamp
  notes?: string;
};

export type Preferences = {
  theme: "light" | "dark";
  highContrast: boolean;
  largerText: boolean;
  autoCheckIn: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  outlookSync: boolean;
  amenities: AmenityId[];
};

type AppState = {
  currentUserId: string;
  bookings: Booking[];
  preferences: Preferences;
  onboarded: boolean;
};

const STORAGE_KEY = "spaces-lbg-state-v1";

const DEFAULT_PREFS: Preferences = {
  theme: "light",
  highContrast: false,
  largerText: false,
  autoCheckIn: false,
  emailNotifications: true,
  pushNotifications: true,
  outlookSync: true,
  amenities: [],
};

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function loadInitial(): AppState {
  if (typeof window === "undefined") {
    return {
      currentUserId: DEFAULT_USER_ID,
      bookings: [],
      preferences: { ...DEFAULT_PREFS },
      onboarded: false,
    };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      const user = parsed.currentUserId && USER_BY_ID[parsed.currentUserId]
        ? parsed.currentUserId
        : DEFAULT_USER_ID;
      return {
        currentUserId: user,
        bookings: parsed.bookings ?? [],
        preferences: { ...DEFAULT_PREFS, ...(parsed.preferences ?? {}) },
        onboarded: parsed.onboarded ?? false,
      };
    }
  } catch {
    // ignore corrupt storage
  }
  // Seed a teammate booking for today so the map has some "booked-by-teammate" data.
  const seed: Booking[] = seedTeamBookings();
  return {
    currentUserId: DEFAULT_USER_ID,
    bookings: seed,
    preferences: { ...DEFAULT_PREFS },
    onboarded: false,
  };
}

function seedTeamBookings(): Booking[] {
  // Give 8 random users a desk today so the map isn't empty on first load.
  const today = todayISO();
  const out: Booking[] = [];
  const picks = APP_USERS.filter((u) => u.id !== DEFAULT_USER_ID).slice(0, 12);
  const desks = Object.values(DESK_BY_ID).slice(0, 80);
  picks.forEach((u, i) => {
    const desk = desks[i * 5 + 3];
    if (!desk) return;
    out.push({
      id: `seed-${u.id}`,
      userId: u.id,
      type: "desk",
      deskId: desk.id,
      date: today,
      start: "09:00",
      end: "17:30",
      status: "confirmed",
    });
  });
  return out;
}

type Ctx = {
  state: AppState;
  user: AppUser;
  setCurrentUser: (id: string) => void;
  addBooking: (
    b: Omit<Booking, "id" | "status"> & { status?: BookingStatus; userId?: string },
  ) => Booking;
  cancelBooking: (id: string) => void;
  checkIn: (id: string) => void;
  checkOut: (id: string) => void;
  updatePreferences: (p: Partial<Preferences>) => void;
  setOnboarded: (v: boolean) => void;
  bookingsForUser: (userId?: string) => Booking[];
  bookingsForDate: (date: string) => Booking[];
  myBookingForToday: () => Booking | undefined;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadInitial());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  // Apply theme / contrast / text-size classes to <html>.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", state.preferences.theme === "dark");
    root.classList.toggle("high-contrast", state.preferences.highContrast);
    root.classList.toggle("larger-text", state.preferences.largerText);
  }, [state.preferences.theme, state.preferences.highContrast, state.preferences.largerText]);

  const user = USER_BY_ID[state.currentUserId] ?? USER_BY_ID[DEFAULT_USER_ID]!;

  const setCurrentUser = useCallback((id: string) => {
    setState((s) => ({ ...s, currentUserId: id }));
  }, []);

  const addBooking: Ctx["addBooking"] = useCallback(
    (b) => {
      const booking: Booking = {
        id: crypto.randomUUID(),
        userId: b.userId ?? state.currentUserId,
        bookedByUserId: state.currentUserId,
        status: b.status ?? "confirmed",
        ...b,
      };
      setState((s) => ({ ...s, bookings: [...s.bookings, booking] }));
      return booking;
    },
    [state.currentUserId],
  );

  const cancelBooking = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, status: "cancelled" as const } : b,
      ),
    }));
  }, []);

  const checkIn = useCallback((id: string) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, checkedInAt: now, checkedOutAt: undefined } : b,
      ),
    }));
  }, []);

  const checkOut = useCallback((id: string) => {
    const now = new Date().toISOString();
    setState((s) => ({
      ...s,
      bookings: s.bookings.map((b) =>
        b.id === id ? { ...b, checkedOutAt: now } : b,
      ),
    }));
  }, []);

  const updatePreferences = useCallback((p: Partial<Preferences>) => {
    setState((s) => ({ ...s, preferences: { ...s.preferences, ...p } }));
  }, []);

  const setOnboarded = useCallback((v: boolean) => {
    setState((s) => ({ ...s, onboarded: v }));
  }, []);

  const bookingsForUser = useCallback(
    (userId?: string) =>
      state.bookings.filter(
        (b) => b.userId === (userId ?? state.currentUserId) && b.status !== "cancelled",
      ),
    [state.bookings, state.currentUserId],
  );

  const bookingsForDate = useCallback(
    (date: string) =>
      state.bookings.filter((b) => b.date === date && b.status !== "cancelled"),
    [state.bookings],
  );

  const myBookingForToday = useCallback(() => {
    const today = todayISO();
    return state.bookings.find(
      (b) =>
        b.userId === state.currentUserId &&
        b.date === today &&
        b.status === "confirmed",
    );
  }, [state.bookings, state.currentUserId]);

  const value: Ctx = useMemo(
    () => ({
      state,
      user,
      setCurrentUser,
      addBooking,
      cancelBooking,
      checkIn,
      checkOut,
      updatePreferences,
      setOnboarded,
      bookingsForUser,
      bookingsForDate,
      myBookingForToday,
    }),
    [
      state,
      user,
      setCurrentUser,
      addBooking,
      cancelBooking,
      checkIn,
      checkOut,
      updatePreferences,
      setOnboarded,
      bookingsForUser,
      bookingsForDate,
      myBookingForToday,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useAppStore() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useAppStore must be used within AppStoreProvider");
  return ctx;
}

export { todayISO };
