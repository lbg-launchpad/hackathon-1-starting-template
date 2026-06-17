import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Building2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore, todayISO } from "@/lib/app-store";
import { getDirectReports } from "@/data/app";
import { Avatar } from "@/components/ui/avatar";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function StatsPage() {
  const { user, bookingsForUser } = useAppStore();

  if (user.appRole !== "manager") {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-[var(--color-fg-muted)]">
          Team stats are available to line managers only.{" "}
          <Link to="/" className="text-[var(--color-primary)] font-medium hover:underline">
            Back home
          </Link>
          .
        </CardContent>
      </Card>
    );
  }

  const reports = getDirectReports(user);
  const today = todayISO();
  const inOfficeToday = reports.filter((r) =>
    bookingsForUser(r.id).some((b) => b.date === today),
  ).length;
  const anchorDayCompliance = Math.round(
    (reports.filter((r) => r.anchorDays.length >= 2).length / Math.max(1, reports.length)) * 100,
  );

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Team stats</h1>
        <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
          Where {user.fullName.split(" ")[0]}'s team is working from.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <Stat
          icon={<Users className="h-5 w-5" />}
          label="Direct reports"
          value={String(reports.length)}
        />
        <Stat
          icon={<Building2 className="h-5 w-5" />}
          label="In the office today"
          value={`${inOfficeToday}/${reports.length}`}
        />
        <Stat
          icon={<TrendingUp className="h-5 w-5" />}
          label="Anchor-day compliance"
          value={`${anchorDayCompliance}%`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Direct reports</CardTitle>
          <CardDescription>Working pattern from Workday.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2">
            {reports.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
              >
                <Avatar initials={r.initials} name={r.fullName} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.fullName}</div>
                  <div className="text-xs text-[var(--color-fg-muted)] truncate">
                    {r.role} · Anchors: {r.anchorDays.join(", ") || "None"}
                  </div>
                </div>
                <Badge variant={bookingsForUser(r.id).some((b) => b.date === today) ? "primary" : "default"}>
                  {bookingsForUser(r.id).some((b) => b.date === today) ? "In office" : "Remote"}
                </Badge>
              </li>
            ))}
            {reports.length === 0 && (
              <li className="text-sm text-[var(--color-fg-muted)] text-center py-6">
                No direct reports.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Button asChild variant="ghost" size="sm" className="self-start">
        <Link to="/">Back home</Link>
      </Button>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-3 px-3">
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-fg)] border border-[oklch(0.42_0.13_150_/_0.2)]">
          {icon}
        </div>
        <div className="font-display text-lg font-semibold leading-tight">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-[var(--color-fg-muted)] leading-tight">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}
