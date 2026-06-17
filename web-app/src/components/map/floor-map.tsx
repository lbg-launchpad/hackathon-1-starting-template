import { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ZoomIn, ZoomOut, Maximize2, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import {
  DESKS_BY_FLOOR,
  FLOORS,
  desksMatchingAmenities,
  type Desk,
  type FloorId,
} from "@/data/desks";
import { type AmenityId } from "@/lib/amenities";
import { USER_BY_ID } from "@/data/app";
import type { Booking } from "@/lib/app-store";

type Props = {
  floor: FloorId;
  selectedDeskId: string | null;
  onSelect: (deskId: string) => void;
  amenityFilters: AmenityId[];
  bookingsForDate: Booking[];
  currentUserId: string;
  teamUserIds: Set<string>;
};

type DeskState =
  | "available"
  | "selected"
  | "team"
  | "occupied"
  | "filtered-out"
  | "mine";

function getState(
  desk: Desk,
  args: {
    selectedDeskId: string | null;
    teamUserIds: Set<string>;
    currentUserId: string;
    bookingByDesk: Map<string, Booking>;
    matchSet: Set<string>;
  },
): DeskState {
  const b = args.bookingByDesk.get(desk.id);
  if (b?.userId === args.currentUserId) return "mine";
  if (desk.id === args.selectedDeskId) return "selected";
  if (b) return args.teamUserIds.has(b.userId) ? "team" : "occupied";
  if (!args.matchSet.has(desk.id)) return "filtered-out";
  return "available";
}

export function FloorMap({
  floor,
  selectedDeskId,
  onSelect,
  amenityFilters,
  bookingsForDate,
  currentUserId,
  teamUserIds,
}: Props) {
  const floorData = FLOORS[floor];
  const desks = DESKS_BY_FLOOR[floor];

  const bookingByDesk = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const b of bookingsForDate) {
      if (b.deskId) map.set(b.deskId, b);
    }
    return map;
  }, [bookingsForDate]);

  const matchSet = useMemo(
    () => new Set(desksMatchingAmenities(desks, amenityFilters).map((d) => d.id)),
    [desks, amenityFilters],
  );

  const viewportRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Reset zoom + scroll when floor changes
  useEffect(() => {
    setScale(1);
    viewportRef.current?.scrollTo({ left: 0, top: 0, behavior: "instant" as ScrollBehavior });
  }, [floor]);

  const zoomIn = () => setScale((s) => Math.min(2.6, Number((s * 1.35).toFixed(2))));
  const zoomOut = () =>
    setScale((s) => {
      const next = Math.max(1, Number((s / 1.35).toFixed(2)));
      if (next === 1) viewportRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
      return next;
    });
  const reset = () => {
    setScale(1);
    viewportRef.current?.scrollTo({ left: 0, top: 0, behavior: "smooth" });
  };

  const pan = (dir: "left" | "right" | "up" | "down") => {
    const vp = viewportRef.current;
    if (!vp) return;
    const step = 80;
    const opts: ScrollToOptions = {
      left: vp.scrollLeft + (dir === "right" ? step : dir === "left" ? -step : 0),
      top: vp.scrollTop + (dir === "down" ? step : dir === "up" ? -step : 0),
      behavior: "smooth",
    };
    vp.scrollTo(opts);
  };

  return (
    <div className="relative rounded-[var(--radius-lg)] glass glass-sheen p-1.5">
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          type="button"
          onClick={zoomIn}
          aria-label="Zoom in"
          disabled={scale >= 2.6}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full glass-pop glass-sheen text-[var(--color-fg)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <ZoomIn className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          aria-label="Zoom out"
          disabled={scale <= 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full glass-pop glass-sheen text-[var(--color-fg)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <ZoomOut className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={reset}
          aria-label="Fit to screen"
          disabled={scale === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full glass-pop glass-sheen text-[var(--color-fg)] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <Maximize2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {/* Pan arrows (visible only when zoomed) */}
      {scale > 1 && (
        <>
          <button
            type="button"
            onClick={() => pan("left")}
            aria-label="Pan left"
            className="absolute top-1/2 left-3 -translate-y-1/2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full glass-pop glass-sheen text-[var(--color-fg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => pan("right")}
            aria-label="Pan right"
            className="absolute top-1/2 right-14 -translate-y-1/2 z-20 inline-flex h-9 w-9 items-center justify-center rounded-full glass-pop glass-sheen text-[var(--color-fg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => pan("up")}
            aria-label="Pan up"
            className="absolute top-3 left-1/2 -translate-x-1/2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full glass-pop glass-sheen text-[var(--color-fg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => pan("down")}
            aria-label="Pan down"
            className="absolute bottom-9 left-1/2 -translate-x-1/2 z-20 inline-flex h-8 w-8 items-center justify-center rounded-full glass-pop glass-sheen text-[var(--color-fg)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
          >
            <ArrowDown className="h-4 w-4" aria-hidden />
          </button>
        </>
      )}

      <div
        ref={viewportRef}
        className="relative overflow-auto rounded-[calc(var(--radius-lg)-6px)] no-scrollbar"
        style={{ aspectRatio: `${floorData.width} / ${floorData.height}` }}
      >
        <div
          ref={innerRef}
          className="relative"
          style={{
            width: `${scale * 100}%`,
            height: `${scale * 100}%`,
            transition: "width 220ms var(--ease-out-soft), height 220ms var(--ease-out-soft)",
          }}
        >
          <img
            src={floorData.image}
            alt={`${floorData.label} plan`}
            className="absolute inset-0 h-full w-full object-cover opacity-80 dark:opacity-50 dark:invert mix-blend-multiply dark:mix-blend-screen"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[oklch(1_0_0_/_0.35)] to-[oklch(1_0_0_/_0.15)] dark:from-[oklch(0.2_0.02_250_/_0.25)] dark:to-[oklch(0.16_0.02_250_/_0.1)]" />

          {/* zone labels */}
          {floorData.zones.map((z) => (
            <div
              key={z.id}
              aria-hidden
              className="absolute hidden xs:flex items-center justify-center pointer-events-none"
              style={{
                left: `${z.x}%`,
                top: `${z.y}%`,
                width: `${z.w}%`,
                height: `${z.h}%`,
              }}
            >
              <span
                className="rounded-[var(--radius-pill)] glass-soft px-2 py-0.5 font-medium uppercase tracking-wider text-[var(--color-fg)]"
                style={{ fontSize: `${Math.max(8, 9 / scale)}px` }}
              >
                {z.name}
              </span>
            </div>
          ))}

          {/* desks */}
          {desks.map((d) => {
            const state = getState(d, {
              selectedDeskId,
              teamUserIds,
              currentUserId,
              bookingByDesk,
              matchSet,
            });
            const booking = bookingByDesk.get(d.id);
            const occupant = booking ? USER_BY_ID[booking.userId] : undefined;
            const interactive =
              state === "available" ||
              state === "selected" ||
              state === "team" ||
              state === "occupied" ||
              state === "mine";

            return (
              <Tooltip key={d.id}>
                <TooltipTrigger asChild>
                  <motion.button
                    type="button"
                    disabled={!interactive}
                    onClick={() => interactive && onSelect(d.id)}
                    whileHover={interactive ? { scale: 1.25 } : undefined}
                    whileTap={interactive ? { scale: 1.05 } : undefined}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    aria-label={`Desk ${d.number}`}
                    className={cn(
                      // Larger invisible hit-target than the visible dot
                      "absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]",
                    )}
                    style={{
                      left: `${d.x}%`,
                      top: `${d.y}%`,
                      width: 28,
                      height: 28,
                    }}
                  >
                    {/* Visible dot */}
                    <span
                      className={cn(
                        "block rounded-full border-2 transition-shadow",
                        state === "available" &&
                          "h-3.5 w-3.5 bg-[var(--color-desk-available)] border-white/90 shadow-[0_2px_6px_oklch(0.18_0.03_150_/_0.35)]",
                        state === "selected" &&
                          "h-5 w-5 bg-[var(--color-desk-selected)] border-white shadow-[0_0_0_3px_oklch(0.42_0.13_150_/_0.4),0_4px_10px_-2px_oklch(0.42_0.13_150_/_0.6)]",
                        state === "team" &&
                          "h-4 w-4 bg-[var(--color-desk-team)] border-white shadow-[0_0_0_2px_oklch(0.66_0.15_75_/_0.4)]",
                        state === "occupied" &&
                          "h-3 w-3 bg-[var(--color-desk-unavailable)] border-white/80",
                        state === "filtered-out" &&
                          "h-1.5 w-1.5 bg-[var(--color-desk-unavailable)]/40 border-transparent",
                        state === "mine" &&
                          "h-5 w-5 bg-[var(--color-primary)] border-white shadow-[0_0_0_3px_oklch(0.42_0.13_150_/_0.5)]",
                      )}
                    />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent className="hidden md:block">
                  {state === "team" && occupant ? (
                    <div className="max-w-[200px]">
                      <div className="font-semibold text-[13px]">{occupant.fullName}</div>
                      <div className="text-[11px] text-[var(--color-fg-muted)]">{occupant.role}</div>
                      <div className="mt-1 text-[10px] text-[var(--color-fg-muted)]">
                        Desk {d.number} · Your team
                      </div>
                    </div>
                  ) : state === "occupied" && occupant ? (
                    <div className="max-w-[200px]">
                      <div className="font-semibold text-[13px]">{occupant.fullName}</div>
                      <div className="text-[11px] text-[var(--color-fg-muted)]">{occupant.role}</div>
                      <div className="mt-1 text-[10px] text-[var(--color-fg-muted)]">
                        Desk {d.number}
                      </div>
                    </div>
                  ) : state === "mine" ? (
                    <div className="font-semibold">Your desk · {d.number}</div>
                  ) : (
                    <div>
                      <div className="font-semibold">Desk {d.number}</div>
                      <div className="text-[10px] text-[var(--color-fg-muted)]">
                        Tap to see amenities
                      </div>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* legend + zoom level */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-[10px] text-[var(--color-fg-muted)]">
        <div className="flex items-center gap-2 flex-wrap">
          <LegendDot color="var(--color-desk-available)" label="Available" />
          <LegendDot color="var(--color-desk-team)" label="Teammate" />
          <LegendDot color="var(--color-desk-selected)" label="Selected" />
          <LegendDot color="var(--color-desk-unavailable)" label="Booked" />
        </div>
        {scale > 1 && (
          <span className="font-mono">{Math.round(scale * 100)}%</span>
        )}
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-block h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
