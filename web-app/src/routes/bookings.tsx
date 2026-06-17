import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarCheck, MapPin, X, Plus, LogIn, LogOut, Mail } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore, todayISO } from "@/lib/app-store";
import { DESK_BY_ID, FLOORS } from "@/data/desks";
import { AMENITY_BY_ID } from "@/lib/amenities";
import { renderCancellation, sendMockEmail } from "@/lib/mock-email";

export const Route = createFileRoute("/bookings")({
  component: BookingsPage,
});

function BookingsPage() {
  const { user, bookingsForUser, cancelBooking, checkIn, checkOut } = useAppStore();
  const today = todayISO();
  const all = [...bookingsForUser()].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = all.filter((b) => b.date >= today);
  const past = all.filter((b) => b.date < today).reverse();

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">My bookings</h1>
          <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
            {upcoming.length} upcoming · {past.length} past
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/book">
            <Plus className="h-4 w-4" aria-hidden />
            New
          </Link>
        </Button>
      </header>

      {upcoming.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-sm text-[var(--color-fg-muted)]">
            No upcoming bookings.{" "}
            <Link to="/book" className="text-[var(--color-primary)] font-medium hover:underline">
              Book a desk
            </Link>
            .
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] mb-2">
            Upcoming
          </h2>
          <ul className="grid gap-3">
            {upcoming.map((b) => {
              const desk = b.deskId ? DESK_BY_ID[b.deskId] : null;
              const floor = desk ? FLOORS[desk.floor] : null;
              const isToday = b.date === today;
              return (
                <li key={b.id}>
                  <Card>
                    <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-fg)]">
                          <CalendarCheck className="h-5 w-5" aria-hidden />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-lg font-semibold">
                              {desk?.number ?? "Meeting room"}
                            </span>
                            {isToday && <Badge variant="primary">Today</Badge>}
                            {b.status === "requested" && <Badge variant="warning">Requested</Badge>}
                          </div>
                          <div className="text-sm text-[var(--color-fg-muted)]">
                            {floor?.label} · {new Date(b.date).toLocaleDateString("en-GB", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            })}{" "}
                            · {b.start}–{b.end}
                          </div>
                          {desk && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {desk.amenities.slice(0, 3).map((a) => (
                                <Badge key={a} variant="outline">
                                  {AMENITY_BY_ID[a].label}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                        {isToday && !b.checkedInAt && (
                          <Button
                            size="sm"
                            onClick={() => {
                              checkIn(b.id);
                              toast.success("Checked in");
                            }}
                          >
                            <LogIn className="h-4 w-4" aria-hidden />
                            Check in
                          </Button>
                        )}
                        {isToday && b.checkedInAt && !b.checkedOutAt && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              checkOut(b.id);
                              toast.success("Checked out");
                            }}
                          >
                            <LogOut className="h-4 w-4" aria-hidden />
                            Check out
                          </Button>
                        )}
                        {isToday && (
                          <Button asChild variant="secondary" size="sm">
                            <Link to="/wayfinder">
                              <MapPin className="h-4 w-4" aria-hidden />
                              Wayfinder
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            cancelBooking(b.id);
                            if (desk && floor) {
                              sendMockEmail(
                                renderCancellation({
                                  to: user.email,
                                  toName: user.fullName,
                                  deskNumber: desk.number,
                                  date: new Date(b.date).toLocaleDateString("en-GB", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  }),
                                  location: b.location ?? user.location,
                                  floor: floor.label,
                                  reason: "User cancelled",
                                }),
                              );
                            }
                            toast("Booking cancelled", {
                              description: "Cancellation email sent.",
                              icon: <Mail className="h-4 w-4" />,
                            });
                          }}
                        >
                          <X className="h-4 w-4" aria-hidden />
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] mb-2">
            Past
          </h2>
          <ul className="grid gap-2">
            {past.slice(0, 10).map((b) => {
              const desk = b.deskId ? DESK_BY_ID[b.deskId] : null;
              return (
                <li
                  key={b.id}
                  className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm"
                >
                  <span>
                    <span className="font-medium">{desk?.number ?? "Room"}</span>{" "}
                    <span className="text-[var(--color-fg-muted)]">
                      · {new Date(b.date).toLocaleDateString("en-GB")}
                    </span>
                  </span>
                  <span className="text-xs text-[var(--color-fg-muted)]">
                    {b.start}–{b.end}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
