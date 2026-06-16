import { Sun, Sunrise, Sunset, Settings2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type TimeSlotPreset = "all-day" | "morning" | "afternoon" | "custom";

export const PRESETS: Record<
  Exclude<TimeSlotPreset, "custom">,
  { start: string; end: string; label: string }
> = {
  "all-day": { start: "09:00", end: "17:30", label: "All day" },
  morning: { start: "09:00", end: "13:00", label: "Morning" },
  afternoon: { start: "13:00", end: "17:30", label: "Afternoon" },
};

type Props = {
  preset: TimeSlotPreset;
  start: string;
  end: string;
  onChange: (next: { preset: TimeSlotPreset; start: string; end: string }) => void;
};

export function TimeSlotPicker({ preset, start, end, onChange }: Props) {
  const apply = (next: TimeSlotPreset) => {
    if (next === "custom") {
      onChange({ preset: "custom", start, end });
    } else {
      onChange({ preset: next, start: PRESETS[next].start, end: PRESETS[next].end });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)] px-1">
        Time
        <span className="font-mono text-[10px] text-[var(--color-fg)]">
          {start}–{end}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <Pill
          active={preset === "all-day"}
          icon={<Sun className="h-3.5 w-3.5" />}
          label="All day"
          onClick={() => apply("all-day")}
        />
        <Pill
          active={preset === "morning"}
          icon={<Sunrise className="h-3.5 w-3.5" />}
          label="Morning"
          onClick={() => apply("morning")}
        />
        <Pill
          active={preset === "afternoon"}
          icon={<Sunset className="h-3.5 w-3.5" />}
          label="Afternoon"
          onClick={() => apply("afternoon")}
        />
        <Pill
          active={preset === "custom"}
          icon={<Settings2 className="h-3.5 w-3.5" />}
          label="Custom"
          onClick={() => apply("custom")}
        />
      </div>
      {preset === "custom" && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <label className="grid gap-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)] px-1">
              Start
            </span>
            <input
              type="time"
              value={start}
              onChange={(e) =>
                onChange({ preset: "custom", start: e.target.value, end })
              }
              className="glass glass-sheen rounded-[var(--radius-md)] px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)] px-1">
              End
            </span>
            <input
              type="time"
              value={end}
              min={start}
              onChange={(e) =>
                onChange({ preset: "custom", start, end: e.target.value })
              }
              className="glass glass-sheen rounded-[var(--radius-md)] px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
            />
          </label>
        </div>
      )}
    </div>
  );
}

function Pill({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-md)] py-2 text-[11px] font-medium transition-colors",
        active
          ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[0_4px_10px_-4px_oklch(0.42_0.13_150_/_0.5)]"
          : "glass glass-sheen text-[var(--color-fg)] hover:bg-[var(--glass-bg-strong)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
