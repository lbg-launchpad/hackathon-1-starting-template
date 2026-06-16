import { Link } from "@tanstack/react-router";
import {
  Moon,
  Sun,
  Settings,
  LogOut,
  BarChart3,
  ChevronDown,
} from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
  const { user, state, updatePreferences } = useAppStore();
  const dark = state.preferences.theme === "dark";

  return (
    <header className="sticky top-0 z-20 w-full">
      <div className="mx-3 mt-3 rounded-[var(--radius-pill)] glass-strong glass-sheen flex h-12 items-center justify-between pl-4 pr-1.5">
        <Link
          to="/"
          className="flex items-center gap-2 font-display text-base font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded-[var(--radius-pill)]"
        >
          <span
            className="inline-block h-5 w-5 rounded-[var(--radius-sm)] shadow-[inset_0_0_0_1px_oklch(1_0_0_/_0.4)]"
            style={{ background: "var(--color-primary)" }}
            aria-hidden
          />
          <span className="leading-none">
            Spaces<span className="text-[var(--color-primary)]">@LBG</span>
          </span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-[var(--radius-pill)] py-1 pl-1 pr-2 hover:bg-[var(--color-surface-2)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]">
            <Avatar initials={user.initials} name={user.fullName} size={28} />
            <ChevronDown className="h-3.5 w-3.5 text-[var(--color-fg-muted)]" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>
              {user.fullName}
              <div className="text-[10px] font-medium normal-case tracking-normal text-[var(--color-fg-subtle)] mt-0.5">
                {user.team} · {user.appRole === "manager" ? "Line manager" : user.appRole === "pa" ? "PA" : "Employee"}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/preferences">
                <Settings className="h-4 w-4" aria-hidden />
                Preferences
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                updatePreferences({ theme: dark ? "light" : "dark" });
              }}
            >
              {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
              {dark ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>
            {user.appRole === "manager" && (
              <DropdownMenuItem asChild>
                <Link to="/stats">
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  Team stats
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/login">
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
