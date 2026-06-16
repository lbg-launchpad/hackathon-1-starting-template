import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarCheck, Users, Map } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { to: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { to: "/bookings", label: "Bookings", icon: CalendarCheck, match: (p: string) => p.startsWith("/bookings") },
  { to: "/team", label: "Team", icon: Users, match: (p: string) => p.startsWith("/team") },
  { to: "/wayfinder", label: "Wayfinder", icon: Map, match: (p: string) => p.startsWith("/wayfinder") },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[416px] pb-[max(env(safe-area-inset-bottom),0px)]"
    >
      <div className="glass-strong glass-sheen rounded-[var(--radius-pill)] px-1.5 py-1.5">
        <ul className="flex items-center justify-around gap-0.5">
          {ITEMS.map((it) => {
            const Icon = it.icon;
            const active = it.match(pathname);
            return (
              <li key={it.to} className="flex-1">
                <Link
                  to={it.to}
                  className={cn(
                    "group flex flex-col items-center justify-center gap-0.5 rounded-[var(--radius-pill)] py-1.5 px-2 text-[10px] font-medium transition-all duration-[var(--duration-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
                    active
                      ? "text-[var(--color-primary-fg)] bg-[var(--color-primary)] shadow-[0_6px_14px_-6px_oklch(0.42_0.13_150_/_0.6)]"
                      : "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface)]/40",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-transform duration-[var(--duration-fast)]",
                      active && "scale-105",
                    )}
                    aria-hidden
                  />
                  <span>{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
