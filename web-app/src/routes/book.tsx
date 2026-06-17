import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  Mail,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FloorMap } from "@/components/map/floor-map";
import { AmenityFilter } from "@/components/map/amenity-filter";
import { DeskDetailSheet } from "@/components/map/desk-detail-sheet";
import { TimeSlotPicker, PRESETS, type TimeSlotPreset } from "@/components/book/time-slot-picker";
import {
  BookForTeamSheet,
  type TeamAssignment,
} from "@/components/book/book-for-team-sheet";
import {
  FLOORS,
  DESK_BY_ID,
  BUILDINGS_BY_LOCATION,
  type FloorId,
  type LocationId,
} from "@/data/desks";
import { type AmenityId } from "@/lib/amenities";
import { useAppStore, todayISO } from "@/lib/app-store";
import { getTeam, USER_BY_ID } from "@/data/app";
import { cn } from "@/lib/cn";
import {
  renderConfirmation,
  sendMockEmail,
} from "@/lib/mock-email";

export const Route = createFileRoute("/book")({
  component: BookPage,
});

const MAX_DESK_HORIZON_DAYS = 28;
const MAX_ROOM_HORIZON_DAYS = 90;
const PA_ROOM_HORIZON_DAYS = 365;

function addDays(iso: string, n: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDateShort(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function BookPage() {
  const { user, addBooking, bookingsForDate } = useAppStore();
  const userLocation = (user.location ?? "London") as LocationId;

  const [location, setLocation] = useState<LocationId>(userLocation);
  const building = BUILDINGS_BY_LOCATION[location];
  const availableFloors = building.floorIds;

  const [floor, setFloor] = useState<FloorId>(availableFloors[0]!);
  // Reset to the first valid floor when the location changes
  useEffect(() => {
    if (!availableFloors.includes(floor)) {
      setFloor(availableFloors[0]!);
    }
  }, [location, availableFloors, floor]);

  const [date, setDate] = useState<string>(todayISO());
  const [slotPreset, setSlotPreset] = useState<TimeSlotPreset>("all-day");
  const [start, setStart] = useState<string>(PRESETS["all-day"].start);
  const [end, setEnd] = useState<string>(PRESETS["all-day"].end);

  const [amenityFilters, setAmenityFilters] = useState<AmenityId[]>([]);
  const [selectedDeskId, setSelectedDeskId] = useState<string | null>(null);
  const [teamSheetOpen, setTeamSheetOpen] = useState(false);

  const todayBookings = bookingsForDate(date);
  const teamUserIds = useMemo(() => new Set(getTeam(user).map((u) => u.id)), [user]);

  const selectedDesk = selectedDeskId ? DESK_BY_ID[selectedDeskId] : null;
  const selectedBooking = selectedDesk
    ? todayBookings.find((b) => b.deskId === selectedDesk.id)
    : undefined;

  const horizonDay = Math.min(
    MAX_DESK_HORIZON_DAYS,
    user.bookingWindowDays ?? MAX_DESK_HORIZON_DAYS,
  );
  const maxDate = addDays(todayISO(), horizonDay);
  const minDate = todayISO();

  const dayChips = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), i));

  const sendBookingEmail = (
    toUserId: string,
    deskNumber: string,
    floorId: FloorId,
  ) => {
    const recipient = USER_BY_ID[toUserId];
    if (!recipient) return;
    const email = renderConfirmation({
      to: recipient.email,
      toName: recipient.fullName,
      deskNumber,
      date: formatDateShort(date),
      start,
      end,
      location: `${building.name}, ${location}`,
      floor: FLOORS[floorId].label,
    });
    sendMockEmail(email);
  };

  const handleBookSelected = () => {
    if (!selectedDesk) return;
    addBooking({
      type: "desk",
      deskId: selectedDesk.id,
      date,
      start,
      end,
      location,
    });
    sendBookingEmail(user.id, selectedDesk.number, selectedDesk.floor);
    toast.success(`Desk ${selectedDesk.number} booked`, {
      description: `${formatDateShort(date)} · ${start}–${end}`,
      icon: <Mail className="h-4 w-4" />,
    });
    setSelectedDeskId(null);
  };

  const handleConfirmTeam = (assignments: TeamAssignment[]) => {
    let count = 0;
    for (const a of assignments) {
      if (a.status === "ready" && a.desk) {
        addBooking({
          type: "desk",
          deskId: a.desk.id,
          userId: a.user.id,
          date,
          start,
          end,
          location,
        });
        sendBookingEmail(a.user.id, a.desk.number, a.desk.floor);
        count++;
      } else if (a.status === "clash") {
        addBooking({
          type: "desk",
          deskId: a.desk?.id,
          userId: a.user.id,
          date,
          start,
          end,
          location,
          status: "requested",
        });
      }
    }
    setTeamSheetOpen(false);
    toast.success(`${count} desks booked for your team`, {
      description: `${formatDateShort(date)} · confirmations sent`,
      icon: <Mail className="h-4 w-4" />,
    });
  };

  return (
    <div className="grid gap-4">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Book a space</h1>
        <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
          Desks up to 4 weeks · meeting rooms up to 3 months
          {user.appRole === "pa" ? " · PAs 1 year" : ""}.
        </p>
      </header>

      <Tabs defaultValue="desk">
        <TabsList>
          <TabsTrigger value="desk">
            <Building2 className="h-3.5 w-3.5 mr-1" aria-hidden />
            Desk
          </TabsTrigger>
          <TabsTrigger value="room">
            <CalendarCheck className="h-3.5 w-3.5 mr-1" aria-hidden />
            Meeting room
          </TabsTrigger>
        </TabsList>

        <TabsContent value="desk" className="grid gap-3">
          {/* Location selector */}
          <div className="grid gap-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] px-1">
              <MapPin className="h-3 w-3" aria-hidden />
              Location
              <span className="text-[var(--color-fg)] font-normal normal-case tracking-normal ml-1">
                · {building.name}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(Object.keys(BUILDINGS_BY_LOCATION) as LocationId[]).map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setLocation(loc)}
                  className={cn(
                    "rounded-[var(--radius-md)] px-2 py-2 text-xs font-medium transition-colors text-center",
                    location === loc
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[0_4px_10px_-4px_oklch(0.42_0.13_150_/_0.5)]"
                      : "glass glass-sheen text-[var(--color-fg)] hover:bg-[var(--glass-bg-strong)]",
                  )}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {/* Day strip */}
          <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
            <ul className="flex gap-1.5 w-max">
              {dayChips.map((iso) => {
                const d = new Date(iso);
                const active = iso === date;
                const isToday = iso === todayISO();
                return (
                  <li key={iso}>
                    <button
                      type="button"
                      onClick={() => setDate(iso)}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-[var(--radius-md)] w-12 h-14 transition-colors text-center",
                        active
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[0_6px_14px_-6px_oklch(0.42_0.13_150_/_0.55)]"
                          : "glass glass-sheen text-[var(--color-fg)] hover:bg-[var(--glass-bg-strong)]",
                      )}
                    >
                      <span className="text-[10px] uppercase tracking-wider opacity-70">
                        {isToday ? "Today" : d.toLocaleDateString("en-GB", { weekday: "short" })}
                      </span>
                      <span className="font-display text-lg font-semibold leading-tight">
                        {d.getDate()}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Floor + custom date row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex glass glass-sheen rounded-[var(--radius-pill)] p-1 gap-1">
              {availableFloors.map((fid) => {
                const f = FLOORS[fid];
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFloor(f.id)}
                    className={cn(
                      "rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-colors",
                      f.id === floor
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)]"
                        : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => date > minDate && setDate(addDays(date, -1))}
                aria-label="Previous day"
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <input
                type="date"
                value={date}
                min={minDate}
                max={maxDate}
                onChange={(e) => setDate(e.target.value)}
                className="glass glass-sheen rounded-[var(--radius-pill)] px-2 py-1 text-xs h-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => date < maxDate && setDate(addDays(date, 1))}
                aria-label="Next day"
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Time slot */}
          <TimeSlotPicker
            preset={slotPreset}
            start={start}
            end={end}
            onChange={({ preset, start: s, end: e }) => {
              setSlotPreset(preset);
              setStart(s);
              setEnd(e);
            }}
          />

          <AmenityFilter
            selected={amenityFilters}
            onToggle={(id) =>
              setAmenityFilters((cur) =>
                cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
              )
            }
            userDefaults={user.amenities}
            onApplyDefaults={() => setAmenityFilters(user.amenities)}
            onClear={() => setAmenityFilters([])}
          />

          <Button
            variant="soft"
            size="md"
            className="self-start w-full"
            onClick={() => setTeamSheetOpen(true)}
          >
            <Users className="h-4 w-4" aria-hidden />
            Book for my team
          </Button>

          <FloorMap
            floor={floor}
            selectedDeskId={selectedDeskId}
            onSelect={setSelectedDeskId}
            amenityFilters={amenityFilters}
            bookingsForDate={todayBookings}
            currentUserId={user.id}
            teamUserIds={teamUserIds}
          />

          <div className="rounded-[var(--radius-lg)] glass-soft p-3 text-xs text-[var(--color-fg-muted)] text-center">
            Tap a dot to see the desk details and book. Yellow = your team, grey = booked.
          </div>
        </TabsContent>

        <TabsContent value="room">
          <Card>
            <CardContent className="py-5 grid gap-3 text-sm text-[var(--color-fg-muted)]">
              <p>
                Horizon: <strong className="text-[var(--color-fg)]">{user.appRole === "pa" ? "1 year" : "3 months"}</strong>
                {user.appRole === "pa" && " (PA on behalf of execs)"}.
              </p>
              <p>
                Meeting-room booking UI is scoped for the next sprint. Data model and
                horizon enforcement are spec'd in SPEC.md.
              </p>
              <p className="text-[10px]">
                <code>MAX_ROOM_HORIZON_DAYS = {MAX_ROOM_HORIZON_DAYS}</code> ·{" "}
                <code>PA_ROOM_HORIZON_DAYS = {PA_ROOM_HORIZON_DAYS}</code>
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Desk detail sheet */}
      <DeskDetailSheet
        desk={selectedDesk}
        booking={selectedBooking}
        isMine={selectedBooking?.userId === user.id}
        isTeam={
          !!selectedBooking && teamUserIds.has(selectedBooking.userId)
        }
        date={date}
        start={start}
        end={end}
        locationLabel={`${building.name}, ${location}`}
        onClose={() => setSelectedDeskId(null)}
        onBook={handleBookSelected}
      />

      {/* Book-for-team sheet */}
      <BookForTeamSheet
        open={teamSheetOpen}
        onOpenChange={setTeamSheetOpen}
        currentUser={user}
        floor={floor}
        date={date}
        start={start}
        end={end}
        existingBookings={todayBookings}
        onConfirm={handleConfirmTeam}
      />
    </div>
  );
}
