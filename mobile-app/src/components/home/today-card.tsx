import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Building2, MapPin, ArrowRight, LogIn, LogOut, CheckCircle2 } from "lucide-react";
import { AnimatedSky } from "./animated-sky";
import { Button } from "@/components/ui/button";
import { greetingFor, type Greeting } from "@/lib/use-now";
import type { Booking } from "@/lib/app-store";
import { DESK_BY_ID, FLOORS } from "@/data/desks";
import { AMENITY_BY_ID } from "@/lib/amenities";

type Props = {
  now: Date;
  firstName: string;
  booking: Booking | undefined;
  onCheckIn: () => void;
  onCheckOut: () => void;
};

function timeOfDay(iso: string | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TodayCard({ now, firstName, booking, onCheckIn, onCheckOut }: Props) {
  const greeting: Greeting = greetingFor(now, firstName);
  const desk = booking?.deskId ? DESK_BY_ID[booking.deskId] : undefined;
  const floor = desk ? FLOORS[desk.floor] : undefined;
  const checkedIn = !!booking?.checkedInAt;
  const checkedOut = !!booking?.checkedOutAt;

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-glass)] border border-[var(--glass-border)]">
      <AnimatedSky partOfDay={greeting.partOfDay} />
      <div className="relative z-10 flex flex-col gap-4 p-5 min-h-[260px]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-white drop-shadow-[0_1px_2px_oklch(0_0_0_/_0.25)]"
        >
          <p className="font-display text-2xl font-semibold leading-tight">
            {greeting.text}.
          </p>
          <p className="mt-1 text-sm text-white/90">
            {booking ? "Here's where you're working today." : "Where would you like to work today?"}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="mt-auto"
        >
          {booking && desk && floor ? (
            <div className="rounded-[var(--radius-lg)] glass-pop glass-sheen p-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                    Today's desk
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-2xl font-semibold">{desk.number}</span>
                    <span className="text-xs text-[var(--color-fg-muted)]">
                      {floor.label}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-[var(--color-fg-muted)]">
                  {booking.start}–{booking.end}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {desk.amenities.slice(0, 3).map((a) => {
                  const am = AMENITY_BY_ID[a];
                  const Icon = am.icon;
                  return (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] glass-soft px-2 py-0.5 text-[10px]"
                    >
                      <Icon className="h-3 w-3" aria-hidden />
                      {am.label}
                    </span>
                  );
                })}
                {desk.amenities.length > 3 && (
                  <span className="text-[10px] text-[var(--color-fg-muted)] self-center">
                    +{desk.amenities.length - 3}
                  </span>
                )}
              </div>

              {checkedIn && (
                <div className="mt-3 text-[10px] text-[var(--color-fg-muted)] flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-[var(--color-success)]" aria-hidden />
                    Checked in {timeOfDay(booking.checkedInAt)}
                  </span>
                  {checkedOut && (
                    <span>· Checked out {timeOfDay(booking.checkedOutAt)}</span>
                  )}
                </div>
              )}

              <div className="mt-3 flex gap-2">
                {!checkedIn && (
                  <Button variant="primary" size="sm" className="flex-1" onClick={onCheckIn}>
                    <LogIn className="h-4 w-4" aria-hidden />
                    Check in
                  </Button>
                )}
                {checkedIn && !checkedOut && (
                  <Button variant="primary" size="sm" className="flex-1" onClick={onCheckOut}>
                    <LogOut className="h-4 w-4" aria-hidden />
                    Check out
                  </Button>
                )}
                {checkedOut && (
                  <Button variant="secondary" size="sm" className="flex-1" disabled>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Done for today
                  </Button>
                )}
                <Button asChild variant="secondary" size="sm">
                  <Link to="/wayfinder">
                    <MapPin className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] glass-pop glass-sheen p-4">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)]">
                No booking today
              </div>
              <p className="mt-1 font-display text-lg font-semibold">
                Book a desk in seconds
              </p>
              <Button asChild variant="primary" size="md" className="mt-3 w-full">
                <Link to="/book">
                  <Building2 className="h-4 w-4" aria-hidden />
                  Find a desk
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
