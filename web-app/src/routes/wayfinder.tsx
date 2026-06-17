import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, DoorOpen, ArrowUpCircle, MapPin, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/app-store";
import { DESK_BY_ID, FLOORS } from "@/data/desks";

export const Route = createFileRoute("/wayfinder")({
  component: WayfinderPage,
});

function WayfinderPage() {
  const { myBookingForToday } = useAppStore();
  const booking = myBookingForToday();
  const desk = booking?.deskId ? DESK_BY_ID[booking.deskId] : null;

  if (!desk) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-[var(--color-fg-muted)]">
          No booking for today.{" "}
          <Link to="/book" className="text-[var(--color-primary)] font-medium hover:underline">
            Book a desk
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const floor = FLOORS[desk.floor];
  const zoneName = floor.zones.find((z) => z.id === desk.zone)?.name ?? "";

  const steps = [
    {
      icon: DoorOpen,
      title: "Enter through the main reception",
      detail: "Show your pass at the speed-gate.",
    },
    floor.id === "ground"
      ? {
          icon: ArrowRight,
          title: `Walk straight ahead to ${zoneName}`,
          detail: "About 30 seconds from reception.",
        }
      : {
          icon: ArrowUpCircle,
          title: "Take the central lift to the first floor",
          detail: "Lifts are immediately on your right.",
        },
    {
      icon: MapPin,
      title: `You'll find ${zoneName} — head to desk ${desk.number}`,
      detail: "Desk number is on the corner of the desk.",
    },
    {
      icon: CheckCircle2,
      title: "Settle in and check in",
      detail: "Tap Check in once you're at the desk.",
    },
  ];

  return (
    <div className="grid gap-5">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Wayfinder</h1>
        <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
          Directions to desk {desk.number} · {floor.label}.
        </p>
      </header>

      <ol className="grid gap-3">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1], delay: i * 0.08 }}
            >
              <Card>
                <CardContent className="flex items-start gap-4 py-4">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-fg)] shrink-0">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[var(--color-fg-muted)]">
                        Step {i + 1}
                      </span>
                    </div>
                    <div className="font-display text-lg font-semibold">{s.title}</div>
                    <div className="text-sm text-[var(--color-fg-muted)]">{s.detail}</div>
                  </div>
                </CardContent>
              </Card>
            </motion.li>
          );
        })}
      </ol>

      <Button asChild variant="secondary" size="lg" className="self-start">
        <Link to="/bookings">Back to bookings</Link>
      </Button>
    </div>
  );
}
