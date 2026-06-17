import { useMemo, useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { X, Users, Check, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/cn";
import { getTeam, type AppUser } from "@/data/app";
import {
  DESKS_BY_FLOOR,
  type FloorId,
  type Desk,
} from "@/data/desks";
import type { Booking } from "@/lib/app-store";

export type TeamAssignment = {
  user: AppUser;
  desk: Desk | null;
  status: "ready" | "clash";
  clashBooking?: Booking;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: AppUser;
  floor: FloorId;
  date: string;
  start: string;
  end: string;
  existingBookings: Booking[];
  onConfirm: (assignments: TeamAssignment[]) => void;
};

// Pick N contiguous-ish desks: nearest neighbours starting from a seed desk.
function pickCluster(available: Desk[], count: number): Desk[] {
  if (available.length === 0 || count === 0) return [];
  // Anchor: pick a desk near the centre of available bounds for variety.
  const sorted = [...available].sort((a, b) => a.x + a.y - (b.x + b.y));
  const anchor = sorted[Math.floor(sorted.length / 2)]!;
  const withDist = available.map((d) => ({
    desk: d,
    dist: Math.hypot(d.x - anchor.x, d.y - anchor.y),
  }));
  withDist.sort((a, b) => a.dist - b.dist);
  return withDist.slice(0, count).map((w) => w.desk);
}

export function BookForTeamSheet({
  open,
  onOpenChange,
  currentUser,
  floor,
  date,
  start,
  end,
  existingBookings,
  onConfirm,
}: Props) {
  const team = useMemo(() => getTeam(currentUser), [currentUser]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"pick" | "review">("pick");

  useEffect(() => {
    if (!open) {
      setSelectedIds(new Set());
      setStep("pick");
    }
  }, [open]);

  const toggle = (id: string) =>
    setSelectedIds((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Build assignments when entering review step.
  const assignments: TeamAssignment[] = useMemo(() => {
    if (step !== "review") return [];
    const occupiedByUser = new Map<string, Booking>();
    const occupiedDeskIds = new Set<string>();
    for (const b of existingBookings) {
      if (b.deskId) {
        occupiedDeskIds.add(b.deskId);
        occupiedByUser.set(b.userId, b);
      }
    }
    const all = DESKS_BY_FLOOR[floor];
    const available = all.filter((d) => !occupiedDeskIds.has(d.id));

    // Include current user + selected teammates
    const teammates = team.filter((t) => selectedIds.has(t.id));
    const includeSelf = !occupiedByUser.has(currentUser.id);
    const needCount = teammates.length + (includeSelf ? 1 : 0);
    const cluster = pickCluster(available, needCount);

    const result: TeamAssignment[] = [];
    let i = 0;
    if (includeSelf) {
      result.push({ user: currentUser, desk: cluster[i] ?? null, status: "ready" });
      i++;
    } else {
      const existing = occupiedByUser.get(currentUser.id);
      result.push({
        user: currentUser,
        desk: existing?.deskId ? all.find((d) => d.id === existing.deskId) ?? null : null,
        status: "clash",
        clashBooking: existing,
      });
    }
    for (const t of teammates) {
      const existing = occupiedByUser.get(t.id);
      if (existing) {
        result.push({
          user: t,
          desk: existing.deskId ? all.find((d) => d.id === existing.deskId) ?? null : null,
          status: "clash",
          clashBooking: existing,
        });
      } else {
        result.push({ user: t, desk: cluster[i] ?? null, status: "ready" });
        i++;
      }
    }
    return result;
  }, [step, selectedIds, team, currentUser, floor, existingBookings]);

  const readyCount = assignments.filter((a) => a.status === "ready" && a.desk).length;
  const clashCount = assignments.filter((a) => a.status === "clash").length;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[6px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 -translate-x-1/2 bottom-0 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 z-50 w-full sm:w-[min(440px,calc(100%-2rem))] max-h-[88dvh] overflow-hidden rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)] glass-pop glass-sheen p-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom focus:outline-none"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col max-h-[88dvh]"
          >
            <div className="flex justify-center pt-2">
              <span className="h-1 w-10 rounded-full bg-[var(--color-border-strong)]/70" />
            </div>

            <header className="px-5 pt-3 pb-2 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogPrimitive.Title className="font-display text-xl font-semibold tracking-tight flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
                  Book for your team
                </DialogPrimitive.Title>
                <div className="mt-0.5 text-xs text-[var(--color-fg-muted)]">
                  {step === "pick"
                    ? "Pick teammates. We'll auto-allocate a cluster of nearby desks."
                    : `${readyCount} desk${readyCount === 1 ? "" : "s"} ready${
                        clashCount ? ` · ${clashCount} clash` : ""
                      }`}
                </div>
              </div>
              <DialogPrimitive.Close
                className="-mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-[var(--glass-bg-soft)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </header>

            <div className="px-5 py-3 overflow-y-auto flex-1">
              {step === "pick" ? (
                <>
                  <div className="flex items-center justify-between text-xs text-[var(--color-fg-muted)] mb-2 px-0.5">
                    <span>{selectedIds.size} selected</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIds(
                          selectedIds.size === team.length
                            ? new Set()
                            : new Set(team.map((t) => t.id)),
                        )
                      }
                      className="text-[var(--color-primary)] font-medium hover:underline"
                    >
                      {selectedIds.size === team.length ? "Clear all" : "Select all"}
                    </button>
                  </div>
                  <ul className="grid gap-1">
                    {team.map((t) => {
                      const active = selectedIds.has(t.id);
                      const alreadyBooked = existingBookings.some(
                        (b) => b.userId === t.id && b.deskId,
                      );
                      return (
                        <li key={t.id}>
                          <button
                            type="button"
                            onClick={() => toggle(t.id)}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-[var(--radius-md)] p-2 text-left transition-colors",
                              active
                                ? "bg-[var(--color-primary-soft)] border border-[oklch(0.42_0.13_150_/_0.25)]"
                                : "glass-soft hover:bg-[var(--glass-bg)]",
                            )}
                          >
                            <Avatar initials={t.initials} name={t.fullName} size={36} />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{t.fullName}</div>
                              <div className="text-[11px] text-[var(--color-fg-muted)] truncate">
                                {t.role}
                              </div>
                            </div>
                            {alreadyBooked && (
                              <Badge variant="warning" className="shrink-0 text-[10px]">
                                Has booking
                              </Badge>
                            )}
                            <span
                              className={cn(
                                "inline-flex h-5 w-5 items-center justify-center rounded-full border-2",
                                active
                                  ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white"
                                  : "border-[var(--color-border-strong)]",
                              )}
                            >
                              {active && <Check className="h-3 w-3" aria-hidden />}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <ul className="grid gap-2">
                  {assignments.map((a) => (
                    <li
                      key={a.user.id}
                      className={cn(
                        "rounded-[var(--radius-md)] p-3 flex items-center gap-3",
                        a.status === "ready"
                          ? "glass-soft"
                          : "bg-[oklch(0.96_0.08_75_/_0.4)] border border-[oklch(0.74_0.16_75_/_0.3)]",
                      )}
                    >
                      <Avatar initials={a.user.initials} name={a.user.fullName} size={32} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {a.user.fullName}
                          {a.user.id === currentUser.id && (
                            <span className="ml-1.5 text-[10px] text-[var(--color-fg-muted)] font-normal">
                              (you)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--color-fg-muted)] truncate">
                          {a.user.role}
                        </div>
                      </div>
                      {a.status === "ready" && a.desk ? (
                        <Badge variant="primary" className="shrink-0">
                          {a.desk.number}
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="shrink-0">
                          <AlertCircle className="h-3 w-3" aria-hidden />
                          Clash
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {step === "review" && clashCount > 0 && (
                <p className="text-[11px] text-[var(--color-fg-muted)] mt-3 px-0.5">
                  Teammates with existing bookings will be sent a swap request — their original
                  desks stay until they confirm.
                </p>
              )}
            </div>

            <footer className="px-5 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3 border-t border-[var(--glass-border-inset)] bg-[var(--glass-bg-soft)] flex gap-2">
              {step === "pick" ? (
                <>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={selectedIds.size === 0}
                    onClick={() => setStep("review")}
                  >
                    <Sparkles className="h-4 w-4" aria-hidden />
                    Auto-allocate
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setStep("pick")}
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={readyCount === 0}
                    onClick={() => onConfirm(assignments)}
                  >
                    Book {readyCount} desk{readyCount === 1 ? "" : "s"}
                  </Button>
                </>
              )}
            </footer>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
