import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import type { Booking } from "@/lib/app-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

type Props = {
  booking: Booking | undefined;
  now: Date;
  onCheckIn: () => void;
};

export function ReminderPanel({ booking, now, onCheckIn }: Props) {
  if (!booking) return null;

  const hour = now.getHours();
  const minute = now.getMinutes();
  const before10am = hour < 10;
  const checkedIn = !!booking.checkedInAt;
  const past10am = !checkedIn && (hour > 10 || (hour === 10 && minute > 0));
  const wrapUpSoon = checkedIn && (() => {
    const [eh, em] = booking.end.split(":").map(Number);
    const endMin = (eh ?? 0) * 60 + (em ?? 0);
    const nowMin = hour * 60 + minute;
    return endMin - nowMin <= 60 && endMin - nowMin > 0;
  })();

  if (checkedIn && !wrapUpSoon) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] glass glass-sheen px-4 py-3 text-sm">
        <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" aria-hidden />
        <span>You're checked in. Have a productive day.</span>
      </div>
    );
  }

  if (wrapUpSoon) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-lg)] glass glass-sheen px-4 py-3 text-sm border-[oklch(0.74_0.16_75_/_0.45)]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[oklch(0.96_0.08_75_/_0.7)] text-[oklch(0.42_0.14_75)]">
          <Clock className="h-3.5 w-3.5" aria-hidden />
        </span>
        <div className="flex-1">
          <div className="font-medium leading-tight">Wrap-up soon</div>
          <div className="text-xs text-[var(--color-fg-muted)]">Slot ends at {booking.end}.</div>
        </div>
        <Button variant="outline" size="sm">
          New desk
        </Button>
      </div>
    );
  }

  if (past10am) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        role="alert"
        className="relative flex flex-col gap-3 rounded-[var(--radius-lg)] glass-pop glass-sheen border-[oklch(0.55_0.21_27_/_0.45)] px-4 py-3.5 shadow-[0_18px_44px_-14px_oklch(0.55_0.21_27_/_0.35)]"
      >
        <div className="flex items-start gap-3">
          <span className={cn("pulse-ring inline-flex items-center justify-center rounded-full bg-[var(--color-danger)] text-white h-8 w-8 shrink-0")}>
            <AlertCircle className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[var(--color-danger)]">
              Desk released — please rebook
            </div>
            <div className="text-xs text-[var(--color-fg-muted)] mt-0.5">
              The 10am rule kicked in. Pick a new desk to keep your day.
            </div>
          </div>
        </div>
        <Button variant="danger" size="md" className="w-full">
          Rebook now
        </Button>
      </motion.div>
    );
  }

  // Pre-10am, not yet checked in → calm but clear nudge
  const minutesUntil10 = (10 - hour) * 60 - minute;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 rounded-[var(--radius-lg)] glass glass-sheen px-4 py-3"
    >
      <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-fg)] h-9 w-9 shrink-0 border border-[oklch(0.42_0.13_150_/_0.2)]">
        <Clock className="h-4 w-4" aria-hidden />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm leading-tight">Check in by 10:00</div>
        <div className="text-xs text-[var(--color-fg-muted)] flex items-center gap-1.5 mt-0.5">
          <span>
            {minutesUntil10 > 0
              ? `${minutesUntil10} min remaining`
              : "Last chance"}
          </span>
          {minutesUntil10 <= 30 && minutesUntil10 > 0 && (
            <Badge variant="warning" className="text-[9px] px-1.5 py-0">Closing soon</Badge>
          )}
        </div>
      </div>
      <Button variant="primary" size="sm" onClick={onCheckIn}>
        Check in
      </Button>
    </motion.div>
  );
}
