import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun, Bell, Mail, Calendar, MapPin, QrCode, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/lib/app-store";
import { AMENITIES, type AmenityId } from "@/lib/amenities";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui/avatar";
import { APP_USERS } from "@/data/app";
import { QrCard } from "@/components/qr-card";
import { EmailInbox } from "@/components/email-inbox";

export const Route = createFileRoute("/preferences")({
  component: PreferencesPage,
});

function PreferencesPage() {
  const { user, state, updatePreferences, setCurrentUser } = useAppStore();
  const prefs = state.preferences;

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Preferences</h1>
        <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">
          Tweak the app. Your desk needs apply to every booking automatically.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            Open on your phone
          </CardTitle>
          <CardDescription>
            Scan from your phone camera to open Spaces@LBG on the go.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QrCard />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Easier on the eyes when you want it.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Row
            icon={prefs.theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            title="Dark mode"
            description="Switch the whole app to a darker palette."
            control={
              <Switch
                checked={prefs.theme === "dark"}
                onCheckedChange={(v) => updatePreferences({ theme: v ? "dark" : "light" })}
              />
            }
          />
          <Row
            title="High contrast"
            description="Stronger borders and darker text. Useful for bright offices."
            control={
              <Switch
                checked={prefs.highContrast}
                onCheckedChange={(v) => updatePreferences({ highContrast: v })}
              />
            }
          />
          <Row
            title="Larger text"
            description="Bumps every font size up by ~12%."
            control={
              <Switch
                checked={prefs.largerText}
                onCheckedChange={(v) => updatePreferences({ largerText: v })}
              />
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check-in</CardTitle>
          <CardDescription>
            Skip the 10am scramble — let the app do it for you.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Row
            icon={<MapPin className="h-4 w-4" />}
            title="Auto check-in"
            description="Quietly check you in when your phone enters the building. Location is only checked when you have a booking that day."
            control={
              <Switch
                checked={prefs.autoCheckIn}
                onCheckedChange={(v) => updatePreferences({ autoCheckIn: v })}
              />
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Row
            icon={<Mail className="h-4 w-4" />}
            title="Email confirmations"
            description="Receipts when you book, change, or cancel."
            control={
              <Switch
                checked={prefs.emailNotifications}
                onCheckedChange={(v) => updatePreferences({ emailNotifications: v })}
              />
            }
          />
          <Row
            icon={<Bell className="h-4 w-4" />}
            title="Push notifications"
            description="Wrap-up nudges and check-in reminders."
            control={
              <Switch
                checked={prefs.pushNotifications}
                onCheckedChange={(v) => updatePreferences({ pushNotifications: v })}
              />
            }
          />
          <Row
            icon={<Calendar className="h-4 w-4" />}
            title="Add to Outlook automatically"
            description="Pop the booking into your work calendar."
            control={
              <Switch
                checked={prefs.outlookSync}
                onCheckedChange={(v) => updatePreferences({ outlookSync: v })}
              />
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My desk needs</CardTitle>
          <CardDescription>
            Tap what you need. These pre-filter every desk search — no disclosure required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const active = prefs.amenities.includes(a.id);
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      updatePreferences({
                        amenities: active
                          ? prefs.amenities.filter((x) => x !== a.id)
                          : ([...prefs.amenities, a.id] as AmenityId[]),
                      })
                    }
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-[var(--color-primary)] text-[var(--color-primary-fg)] border-[var(--color-primary)]"
                        : "bg-[var(--color-surface-2)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
                    )}
                  >
                    <a.icon className="h-3.5 w-3.5" aria-hidden />
                    {a.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>From Workday — read-only.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <KV k="Name" v={user.fullName} />
          <KV k="Employee ID" v={String(user.employeeId)} />
          <KV k="Email" v={user.email} />
          <KV k="Team" v={user.team} />
          <KV k="Location" v={user.location} />
          <KV k="Line manager" v={user.lineManager?.name ?? "—"} />
          <KV k="Anchor days" v={user.anchorDays.join(", ") || "None"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            Booking emails
          </CardTitle>
          <CardDescription>
            Confirmation and cancellation receipts. Mock outbox for the prototype.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailInbox />
        </CardContent>
      </Card>

      {/* Demo user switcher — would not exist in production. */}
      <Card>
        <CardHeader>
          <CardTitle>Demo: switch user</CardTitle>
          <CardDescription>
            Prototype-only. In production, identity comes from Workday SSO.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1 max-h-64 overflow-y-auto">
            {APP_USERS.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setCurrentUser(u.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1 text-left text-sm hover:bg-[var(--color-surface-2)]",
                    u.id === user.id && "bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-fg)]",
                  )}
                >
                  <Avatar initials={u.initials} name={u.fullName} size={24} />
                  <span className="flex-1 truncate">{u.fullName}</span>
                  <span className="text-[10px] text-[var(--color-fg-subtle)] uppercase">
                    {u.appRole}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({
  icon,
  title,
  description,
  control,
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]">
            {icon}
          </span>
        )}
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-[var(--color-fg-muted)] mt-0.5 max-w-md">{description}</div>
        </div>
      </div>
      <div className="pt-1.5">{control}</div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--color-fg-muted)]">{k}</span>
      <span className="font-medium text-right truncate">{v}</span>
    </div>
  );
}
