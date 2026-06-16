import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore, todayISO } from "@/lib/app-store";
import { getTeam } from "@/data/app";
import { DESK_BY_ID, FLOORS } from "@/data/desks";

export const Route = createFileRoute("/team")({
  component: TeamPage,
});

function TeamPage() {
  const { user, bookingsForDate } = useAppStore();
  const today = todayISO();
  const team = getTeam(user);
  const todays = bookingsForDate(today);
  const byUser = new Map(todays.map((b) => [b.userId, b]));

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">My team</h1>
        <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
          {team.length} teammates · {user.team}
        </p>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Today's seating</CardTitle>
          <Button asChild variant="primary" size="sm">
            <Link to="/book">Sit with team</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-2">
            {team.map((t) => {
              const b = byUser.get(t.id);
              const desk = b?.deskId ? DESK_BY_ID[b.deskId] : null;
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <Avatar initials={t.initials} name={t.fullName} size={40} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.fullName}</div>
                    <div className="text-xs text-[var(--color-fg-muted)] truncate">{t.role}</div>
                  </div>
                  {desk ? (
                    <div className="text-right">
                      <Badge variant="primary">
                        <MapPin className="h-3 w-3" aria-hidden />
                        {desk.number}
                      </Badge>
                      <div className="mt-1 text-[10px] text-[var(--color-fg-muted)]">
                        {FLOORS[desk.floor].shortLabel} floor
                      </div>
                    </div>
                  ) : (
                    <Badge variant="default">
                      <Building2 className="h-3 w-3" aria-hidden />
                      Remote
                    </Badge>
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
