import { Check, Sparkles, SlidersHorizontal } from "lucide-react";
import { AMENITIES, type AmenityId } from "@/lib/amenities";
import { cn } from "@/lib/cn";

type Props = {
  selected: AmenityId[];
  onToggle: (id: AmenityId) => void;
  userDefaults: AmenityId[];
  onApplyDefaults: () => void;
  onClear: () => void;
};

export function AmenityFilter({ selected, onToggle, userDefaults, onApplyDefaults, onClear }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-fg-muted)]">
          <SlidersHorizontal className="h-3 w-3" aria-hidden />
          Amenities
          {selected.length > 0 && (
            <span className="text-[var(--color-primary)]">· {selected.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          {userDefaults.length > 0 && (
            <button
              type="button"
              onClick={onApplyDefaults}
              className="inline-flex items-center gap-1 rounded-[var(--radius-pill)] bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-fg)] border border-[oklch(0.42_0.13_150_/_0.2)] px-2 py-0.5 font-medium hover:brightness-95"
            >
              <Sparkles className="h-3 w-3" aria-hidden />
              My needs
            </button>
          )}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
        <ul className="flex gap-1.5 pb-1 w-max">
          {AMENITIES.map((a) => {
            const Icon = a.icon;
            const active = selected.includes(a.id);
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onToggle(a.id)}
                  aria-pressed={active}
                  title={a.description}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-3 py-1.5 text-xs whitespace-nowrap transition-all duration-[var(--duration-fast)]",
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] shadow-[0_4px_10px_-4px_oklch(0.42_0.13_150_/_0.5)]"
                      : "glass-soft text-[var(--color-fg)] hover:bg-[var(--glass-bg)]",
                  )}
                >
                  {active ? <Check className="h-3 w-3" aria-hidden /> : <Icon className="h-3 w-3" aria-hidden />}
                  {a.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
