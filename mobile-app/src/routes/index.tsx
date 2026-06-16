import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Building2, Users, CalendarPlus, ArrowRight, LogIn, LogOut } from "lucide-react";
import { useAppStore } from "@/lib/app-store";
import { useNow } from "@/lib/use-now";
import { TodayCard } from "@/components/home/today-card";
import { ReminderPanel } from "@/components/home/reminder-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeam } from "@/data/app";
import { Avatar } from "@/components/ui/avatar";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const { user, myBookingForToday, checkIn, checkOut } = useAppStore();
  // Re-render every 30s so the greeting updates close to the boundary (morning/afternoon/evening).
  const now = useNow(30_000);
  const todays = myBookingForToday();
  const firstName = user.fullName.split(" ")[0] ?? user.fullName;
  const team = getTeam(user).slice(0, 6);

  const handleCheckIn = () => {
    if (!todays) return;
    checkIn(todays.id);
    toast.success("Checked in", {
      description: "Welcome in.",
      icon: <LogIn className="h-4 w-4" />,
    });
  };
  const handleCheckOut = () => {
    if (!todays) return;
    checkOut(todays.id);
    toast.success("Checked out", {
      description: "Have a good evening.",
      icon: <LogOut className="h-4 w-4" />,
    });
  };

  return (
    <div className="grid gap-4">
      <TodayCard
        now={now}
        firstName={firstName}
        booking={todays}
        onCheckIn={handleCheckIn}
        onCheckOut={handleCheckOut}
      />

      <ReminderPanel booking={todays} now={now} onCheckIn={handleCheckIn} />

      <div className="grid grid-cols-2 gap-3">
        <QuickAction
          to="/book"
          icon={<Building2 className="h-5 w-5" aria-hidden />}
          title="Book a desk"
          subtitle="4 weeks ahead"
        />
        <QuickAction
          to="/book"
          icon={<CalendarPlus className="h-5 w-5" aria-hidden />}
          title="Meeting room"
          subtitle="3 months ahead"
        />
        <QuickAction
          to="/team"
          icon={<Users className="h-5 w-5" aria-hidden />}
          title="Sit with team"
          subtitle={`${team.length} teammates`}
          className="col-span-2"
        />
      </div>

      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-display text-base font-semibold">Your team this week</h2>
              <p className="text-xs text-[var(--color-fg-muted)]">
                {user.team} · {user.location}
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/team">
                All
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </Button>
          </div>
          <ul className="flex -space-x-2">
            {team.map((t) => (
              <li key={t.id} className="rounded-full ring-2 ring-[var(--glass-bg-strong)]">
                <Avatar initials={t.initials} name={t.fullName} size={32} />
              </li>
            ))}
          </ul>
          <ul className="mt-3 flex flex-col gap-1">
            {team.slice(0, 3).map((t) => (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{t.fullName}</span>
                <span className="text-xs text-[var(--color-fg-muted)] truncate ml-3">{t.role}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  title,
  subtitle,
  className,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <Link
      to={to}
      className={`group glass glass-sheen rounded-[var(--radius-lg)] p-4 transition-all duration-[var(--duration-base)] ease-[var(--ease-out-soft)] hover:bg-[var(--glass-bg-strong)] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] ${className ?? ""}`}
    >
      <div className="inline-flex items-center justify-center h-9 w-9 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-fg)] border border-[oklch(0.42_0.13_150_/_0.2)]">
        {icon}
      </div>
      <div className="mt-2.5 font-display text-base font-semibold leading-tight">{title}</div>
      <div className="text-xs text-[var(--color-fg-muted)]">{subtitle}</div>
    </Link>
  );
}
