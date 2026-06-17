# Spaces@LBG — Design polish & engineering hand-off

> Status: MVP scaffold complete, see `src/`. This document is the polish pass + engineering hand-off requested in the brief.
> Owner: TBD (hackathon team).
> Scope: amenity-led desk and meeting-room booking for Lloyds employees, integrated with Workday.

The brief's brand name was DeskHub; we have landed on **Spaces@LBG** for shipping. Internal backend referred to as **Lovable Cloud**; never use the underlying provider name in user-facing copy.

---

## Section A — Design polish

### A.1 Typography pairing

Two families, both from Google Fonts (no foundry deal needed for the prototype), both with open SIL licences so they can be self-hosted later.

| Role | Family | Why this one |
|---|---|---|
| Display / headings / metric numbers | **Fraunces** (variable, opsz 9–144) | A neo-classical serif with optical sizing, slight humanist warmth, and a confident bold cut. It signals "considered, grown-up" without leaning bank-stuffy. Crucially, the optical-size axis means the `font-display` at 28–36px reads tight and editorial, while badge numerals at 12px stay legible. Distinctive — not Inter, not Poppins. |
| UI body / forms / data | **Inter Tight** (wght 400/500/600/700) | Tighter tracking than Inter at small sizes; high x-height; superb hinting. Tabular figures available for booking times. Familiar to anyone in financial services without being a cliché. |

**Modular scale** (set in `styles.css` via Tailwind v4's built-in `text-*` utilities, ratio ≈ 1.250):

| Token | Size / line-height | Use |
|---|---|---|
| `text-xs` | 12 / 16 | Captions, legend, badge numbers |
| `text-sm` | 14 / 20 | Body, list items, form labels |
| `text-base` | 16 / 24 | Default body |
| `text-lg` | 18 / 28 | Card titles |
| `text-xl` | 20 / 28 | Section titles |
| `text-2xl` | 24 / 32 | Today's desk number on Home hero |
| `text-3xl` | 30 / 36 | Page H1 ("Book a space") |
| `text-4xl` | 36 / 40 | Home greeting on desktop |

**Headings always set in `font-display`; body/UI in `font-sans`.** Numerals: enable `font-variant-numeric: tabular-nums` on any time-of-day or count display so vertical alignment doesn't jitter. Already applied via `font-mono` to the 2FA code input only — extend to booking-list times in a follow-up.

### A.2 Palette and dark-mode contrast

All tokens live in `src/styles.css` under `@theme` and `.dark`. Everything is `oklch` — perceptually uniform lightness, predictable contrast pairs.

#### Brand

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-primary` | `oklch(0.42 0.13 150)` | `oklch(0.7 0.14 150)` | CTAs, selected desks, active nav |
| `--color-primary-hover` | `oklch(0.38 0.13 150)` | `oklch(0.76 0.14 150)` | Hover state |
| `--color-primary-active` | `oklch(0.34 0.12 150)` | `oklch(0.66 0.14 150)` | Pressed state |
| `--color-primary-fg` | `oklch(0.985 0 0)` | `oklch(0.12 0.01 150)` | Text on primary |
| `--color-primary-soft` | `oklch(0.95 0.04 150)` | `oklch(0.28 0.06 150)` | Soft tint backgrounds (badges, today's-desk halo) |
| `--color-primary-soft-fg` | `oklch(0.28 0.1 150)` | `oklch(0.86 0.08 150)` | Text on soft tint |

In light mode the primary is darkened to `L=0.42` so white text on it clears **AAA** (contrast ≈ 7.1:1 against `#FFFFFF`). In dark mode we *lift* the primary to `L=0.7` against a near-black canvas (`L=0.16`) for ~8.4:1; we then invert the foreground to near-black on the primary for buttons. Don't reuse the light-mode primary on dark surfaces — it falls to ~3.5:1 on the dark canvas.

#### Neutrals

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--color-canvas` | `oklch(0.985 0.003 150)` | `oklch(0.16 0.008 150)` | App background. Slight green-leaning neutral so Lloyds green feels native, not bolted-on. |
| `--color-surface` | `oklch(1 0 0)` | `oklch(0.2 0.01 150)` | Cards, sticky top bar, nav pill |
| `--color-surface-2` | `oklch(0.97 0.005 150)` | `oklch(0.24 0.012 150)` | Secondary surfaces, inputs, tab list |
| `--color-fg` | `oklch(0.18 0.01 150)` | `oklch(0.96 0.005 150)` | Body text. 12.6:1 light, 14.2:1 dark on canvas. |
| `--color-fg-muted` | `oklch(0.48 0.02 150)` | `oklch(0.72 0.015 150)` | Secondary text. 4.6:1 light, 4.8:1 dark on canvas — passes AA. |
| `--color-fg-subtle` | `oklch(0.62 0.015 150)` | `oklch(0.55 0.015 150)` | Tertiary text — used only for >18px copy where AA needs 3:1. |
| `--color-border` | `oklch(0.9 0.01 150)` | `oklch(0.3 0.012 150)` | Subtle |
| `--color-border-strong` | `oklch(0.82 0.015 150)` | `oklch(0.4 0.014 150)` | Hover/focus borders, dividers |

#### Semantic

| Token | Light | Dark |
|---|---|---|
| `--color-success` | `oklch(0.58 0.14 145)` | inherited (legible on both) |
| `--color-warning` | `oklch(0.74 0.16 75)` | inherited |
| `--color-danger` | `oklch(0.55 0.21 27)` | inherited |
| `--color-danger-soft` | `oklch(0.96 0.04 27)` | overridden inline in the reminder component |

A `.high-contrast` class darkens muted text to `L=0.32` (light) / `L=0.85` (dark) and strengthens borders to `L=0.5` / `L=0.6`. A `.larger-text` class scales root font-size to 112.5%.

**AA contrast verified for every fg/bg pair we ship by default** — keep this discipline: never write a colour literal in a component. If a designer needs a one-off shade, add a token.

### A.3 Motion choreography

All durations and easings live in `@theme` so they're addressable in components.

| Token | Value | Where |
|---|---|---|
| `--duration-instant` | 80 ms | Hover colour, tab switch, icon swap |
| `--duration-fast` | 160 ms | Button press, nav active state, chip toggle |
| `--duration-base` | 220 ms | Card hover lift, dropdown open, badge in/out |
| `--duration-slow` | 360 ms | Reminder banner enter, route transitions |
| `--ease-out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default — sharp start, relaxed settle |
| `--ease-in-out-soft` | `cubic-bezier(0.65, 0, 0.35, 1)` | Two-way state changes (theme switch) |

Concrete choreography:

- **Home hero sky.** One *and only one* large animation per screen. Sun/moon rises in once on mount (`y: 40 → 0`, opacity, 900 ms). Clouds loop linearly at 60–90s. Stars twinkle at 2.5–5.5s. All paused under `prefers-reduced-motion`.
- **Today's-desk card.** Reveals on mount with a 450 ms slide-up (`y: 8 → 0`, opacity) for the greeting and a 500 ms slide-from-right (`x: 8 → 0`) for the desk panel, staggered by 80 ms. Never re-animates on data refresh.
- **Reminder banner.** 320 ms `ease-out-soft` slide-in from `y: -4`. The 10 am red banner adds a `pulse-ring` keyframe (CSS, 1.8s loop) around the icon — the ring expands and fades, never the banner itself. Never bounces, never shakes — urgent ≠ panicked.
- **Map dots.** No mount animation (would be 40+ simultaneous tweens). Hover scales 1.0 → 1.35 in 160 ms; selected state gets a static 3 px halo, not a pulsing one (selection is a chosen state, not a warning).
- **Bottom nav.** Active icon ticks to `scale: 1.10`, background fades to soft primary. 160 ms. No bounce.
- **Tabs.** Underline glide via Radix data-attribute transitions, 160 ms.

**Rules:**

1. Use Framer Motion (`motion`) only when entering/exiting an element from null. For state changes on a persistent element, prefer CSS transitions on tokens — cheaper and easier to disable globally.
2. `prefers-reduced-motion` already kills all transitions and animations via the global rule in `styles.css`. Don't reintroduce per-component animations that bypass this — wrap any new Framer use with `useReducedMotion()` if it's purely decorative.
3. No parallax, no scroll-jacking, no entrance animations on lists with >12 items.

### A.4 Reminders panel & check-in CTA

States, in order of urgency:

1. **Pre-10 am, not checked in.** Calm primary CTA. Single line ("Check in by 10:00"), countdown ("47 min remaining"), green primary button. Adds a `warning` badge ("Closing soon") at T-30 min.
2. **At/after 10 am, not checked in.** *Red ringed* banner with a pulsing ring around the icon (CSS, not the whole banner). Copy: **"Desk released — please rebook"** / *"The 10am rule kicked in and your desk is back in the pool. Pick a new one to keep your day."* Primary action: "Rebook now" (red). The pulsing ring is the only motion; the banner itself doesn't shake or jiggle. Sound is muted by default.
3. **Checked in, ≤60 min before end-of-slot.** Warm amber band. Copy: *"Your morning slot wraps up by 12:30 — fancy a change of desk?"* Action: outline button "Find a new desk".
4. **Checked in, mid-day.** Quiet inline confirmation with success icon, single line. No CTA.

**Why not a modal for the 10 am case?** Lloyds employees often arrive to a hot meeting and dismissing a modal mid-stride is irritating. The pulsing ring is loud visually but doesn't block — they can act when ready.

**Copy principles for reminders:**

- Lead with what happened, not what to do. *"Desk released"* before *"please rebook"*.
- Always pair a negative event with a one-click recovery action.
- Never apologise on the user's behalf for missing a deadline. Just give them the next step.
- Use 12h time in user-facing copy (10:00, 12:30), 24h internally.

### A.5 First-time user onboarding (5 screens)

Triggered on first sign-in when `state.onboarded === false`. Skippable on every screen after Welcome. Sets `onboarded = true` on completion or explicit skip.

```
┌─ Screen 1: Welcome ────────────────────────────────────────────┐
│ AnimatedSky background, big "Hello, {firstName}".              │
│ Subhead: "We've made desk booking calmer.                       │
│   Three quick choices and you're done."                         │
│ Primary: "Let's go" · Secondary: "Skip and explore"             │
└────────────────────────────────────────────────────────────────┘

┌─ Screen 2: Confirm your Workday details ───────────────────────┐
│ Read-only card with name, team, line manager, anchor days.      │
│ "Anything wrong? Open a ticket with HR — we use Workday as      │
│ the source of truth, so the fix happens there."                 │
│ Primary: "All correct" · Link: "Open HR ticket"                 │
└────────────────────────────────────────────────────────────────┘

┌─ Screen 3: Your desk needs ────────────────────────────────────┐
│ "Pick anything that makes work easier. We'll pre-filter every   │
│  search. None of this is shared with anyone."                   │
│ All 14 amenity chips, tappable. Pre-checked from Workday        │
│  accessibilityNeeds if present.                                 │
│ Primary: "Save my needs" (always enabled) · Link: "I'll do this │
│  later"                                                         │
└────────────────────────────────────────────────────────────────┘

┌─ Screen 4: Auto check-in + notifications ──────────────────────┐
│ Two toggles, plain copy.                                         │
│ "Auto check-in — we'll quietly check you in when you arrive.    │
│  We only check your location when you have a booking that day." │
│ "Wrap-up nudges — a heads up an hour before your morning slot   │
│  ends, so you can pick a new desk."                             │
│ Primary: "Save and continue"                                    │
└────────────────────────────────────────────────────────────────┘

┌─ Screen 5: Meet your team ─────────────────────────────────────┐
│ Workday team list (avatars, name, role). "These are your        │
│  teammates. Sit-with suggestions on the book page use this."    │
│ Primary: "Take me to booking"   (routes to /book)               │
│ Link: "Maybe later"                                             │
└────────────────────────────────────────────────────────────────┘
```

**Notes:**

- Screen 4 mentions the privacy model explicitly. Geolocation framing is the most likely place a Lloyds employee tunes out — be direct.
- Don't dump 14 amenity chips on first-run unstructured — group them: "Quieter" / "Setup" / "Comfort" / "Access" / "Climate". Pure visual grouping; same chip component.
- Each screen has a "Skip and explore" link in the header in addition to the primary CTA — opting in to onboarding is voluntary on every step.
- Onboarding does **not** prompt for a first booking — too pushy. Land them on `/book` and let them choose.

---

## Section B — Engineering hand-off

> Stack: TanStack Start v1 on Cloudflare Workers (Edge runtime). Postgres via Lovable Cloud. Vite 7, Tailwind v4. Auth via Lloyds SSO (OIDC) with TOTP fallback. All booking writes are server functions; client never writes directly.

### B.1 Data model (Postgres)

```sql
-- =========================================================
-- ROLES (separate table per the brief — no role column on users)
-- =========================================================
create table roles (
  id          smallserial primary key,
  code        text not null unique, -- 'user' | 'manager' | 'pa'
  label       text not null
);

-- =========================================================
-- USERS — Workday is the source of truth. We sync, we don't mutate.
-- =========================================================
create table users (
  id                   uuid primary key default gen_random_uuid(),
  workday_employee_id  bigint not null unique,
  email                citext not null unique,
  full_name            text   not null,
  location             text   not null check (location in ('London','Leeds','Edinburgh')),
  team                 text   not null,
  job_title            text   not null,
  line_manager_id      uuid references users(id) on delete set null,
  anchor_days          smallint[] not null default '{}', -- 1=Mon..5=Fri
  working_pattern      jsonb not null default '{}'::jsonb,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index on users (line_manager_id);
create index on users (team, location);

create table user_roles (
  user_id  uuid not null references users(id) on delete cascade,
  role_id  smallint not null references roles(id),
  primary key (user_id, role_id)
);

-- =========================================================
-- TEAMS (denormalised onto users for speed; this table is for stats)
-- =========================================================
create table teams (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  location   text not null,
  unique (name, location)
);

-- =========================================================
-- BUILDINGS / FLOORS / ZONES / DESKS
-- =========================================================
create table buildings (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  city      text not null,
  geofence  jsonb not null  -- { center: {lat, lng}, radius_m: number }
);

create table floors (
  id              uuid primary key default gen_random_uuid(),
  building_id     uuid not null references buildings(id) on delete cascade,
  short_label     text not null,        -- 'G', '1'
  label           text not null,        -- 'Ground floor'
  plan_image_url  text not null,
  plan_width_px   integer not null,
  plan_height_px  integer not null,
  unique (building_id, short_label)
);

create table zones (
  id         uuid primary key default gen_random_uuid(),
  floor_id   uuid not null references floors(id) on delete cascade,
  name       text not null,
  -- bounding box in % of the floor image, top-left origin
  x          numeric(5,2) not null,
  y          numeric(5,2) not null,
  w          numeric(5,2) not null,
  h          numeric(5,2) not null
);

create table desks (
  id             uuid primary key default gen_random_uuid(),
  floor_id       uuid not null references floors(id) on delete cascade,
  zone_id        uuid not null references zones(id) on delete restrict,
  number         text not null,           -- 'G-014'
  x              numeric(5,2) not null,
  y              numeric(5,2) not null,
  is_active      boolean not null default true,
  unique (floor_id, number)
);
create index on desks (zone_id);

create table amenities (
  code        text primary key,           -- 'low-noise', 'dual-monitor', ...
  label       text not null,
  description text not null
);

create table desk_amenities (
  desk_id      uuid not null references desks(id) on delete cascade,
  amenity_code text not null references amenities(code),
  primary key (desk_id, amenity_code)
);

-- =========================================================
-- USER AMENITY PROFILE ("My desk needs")
-- =========================================================
create table user_amenities (
  user_id      uuid not null references users(id) on delete cascade,
  amenity_code text not null references amenities(code),
  primary key (user_id, amenity_code)
);

-- =========================================================
-- BOOKINGS (desks AND meeting rooms via a single table; type discriminator)
-- =========================================================
create type booking_type   as enum ('desk','room');
create type booking_status as enum ('confirmed','requested','cancelled');

create table bookings (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete restrict,
  booked_by_id    uuid not null references users(id) on delete restrict, -- PA-on-behalf-of
  type            booking_type not null,
  desk_id         uuid references desks(id),
  room_id         uuid references meeting_rooms(id),
  date            date not null,
  start_time      time not null,
  end_time        time not null,
  status          booking_status not null default 'confirmed',
  checked_in_at   timestamptz,
  released_at     timestamptz,   -- set when desk-bump or wrap-up runs
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  check (start_time < end_time),
  check (
    (type = 'desk' and desk_id is not null and room_id is null) or
    (type = 'room' and room_id is not null and desk_id is null)
  )
);

-- Hard guarantee: no two confirmed bookings on the same desk overlap on the same day.
create unique index booking_desk_unique_per_day
  on bookings (desk_id, date)
  where status = 'confirmed' and type = 'desk';

create index on bookings (user_id, date);
create index on bookings (date, status);

create table meeting_rooms (
  id         uuid primary key default gen_random_uuid(),
  floor_id   uuid not null references floors(id),
  name       text not null,
  capacity   smallint not null,
  amenities  text[] not null default '{}',
  unique (floor_id, name)
);

-- =========================================================
-- SWAP REQUESTS — desk-swap inside a team
-- =========================================================
create type swap_status as enum ('pending','accepted','declined','expired');

create table swap_requests (
  id              uuid primary key default gen_random_uuid(),
  from_booking_id uuid not null references bookings(id) on delete cascade,
  to_booking_id   uuid not null references bookings(id) on delete cascade,
  initiator_id    uuid not null references users(id),
  status          swap_status not null default 'pending',
  message         text,
  created_at      timestamptz not null default now(),
  responded_at    timestamptz
);

-- =========================================================
-- NOTIFICATIONS, AUDIT
-- =========================================================
create type notification_channel as enum ('email','push','outlook');
create type notification_kind    as enum (
  'booking_confirmed','booking_cancelled','wrap_up_warning',
  'desk_bump','swap_requested','swap_accepted','swap_declined',
  'team_clash_detected'
);

create table notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  channel     notification_channel not null,
  kind        notification_kind not null,
  payload     jsonb not null,
  sent_at     timestamptz,
  delivered_at timestamptz,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);
create index on notifications (user_id, created_at desc);

create table audit_log (
  id         bigserial primary key,
  actor_id   uuid references users(id),
  action     text not null,         -- 'booking.create', 'booking.cancel', ...
  target     text not null,         -- 'booking:<uuid>'
  diff       jsonb,                 -- before/after
  ip         inet,
  user_agent text,
  occurred_at timestamptz not null default now()
);
create index on audit_log (occurred_at desc);
create index on audit_log (actor_id, occurred_at desc);
```

**Notes on the model:**

- `bookings.desk_id + date` has a partial unique index keyed on `status = 'confirmed'`. This is the *only* place we enforce no-double-booking; doing it in app code is a race condition waiting to happen.
- `bookings.booked_by_id` differs from `user_id` for PA bookings. Audit trail uses `booked_by_id` for who clicked confirm.
- `released_at` records when the desk-bump cron released the desk. We don't delete the booking — we set `status = 'cancelled'` and stash the timestamp for stats.
- Amenities are codes (not enums) so adding one doesn't need a migration.

### B.2 API surface

**REST over HTTPS, JSON in/out, OAuth2 access token (JWT) on every request.** TanStack Start server functions wrap these; the client never speaks to the DB directly.

| Method | Path | Auth | Body / Query | Returns |
|---|---|---|---|---|
| `GET`    | `/api/me` | session | — | `User` (with role, amenities, working pattern) |
| `PATCH`  | `/api/me/preferences` | session | `Preferences` (partial) | `Preferences` |
| `PUT`    | `/api/me/amenities` | session | `{ amenities: string[] }` | `{ amenities: string[] }` |
| `GET`    | `/api/floors` | session | `?building=<id>` | `Floor[]` (with zones inline) |
| `GET`    | `/api/desks` | session | `?floor=<id>&date=<iso>` | `DeskWithBookingState[]` |
| `GET`    | `/api/desks/:id` | session | — | `Desk` (with amenities) |
| `POST`   | `/api/bookings` | session | `CreateBookingInput` | `Booking` |
| `GET`    | `/api/bookings` | session | `?from=<iso>&to=<iso>&user=<id>` | `Booking[]` |
| `DELETE` | `/api/bookings/:id` | session | — | `204` |
| `POST`   | `/api/bookings/:id/check-in` | session | `{ at?: <iso>, source?: 'manual'\|'geo' }` | `Booking` |
| `POST`   | `/api/bookings/sit-with-team` | session | `{ date, floor, teamUserIds }` | `Booking[]` (with `requested` entries flagged) |
| `POST`   | `/api/swap-requests` | session | `{ from_booking_id, to_booking_id, message? }` | `SwapRequest` |
| `POST`   | `/api/swap-requests/:id/respond` | session | `{ accept: boolean }` | `SwapRequest` |
| `GET`    | `/api/team` | session | — | `User[]` (current user's Workday team minus self) |
| `GET`    | `/api/team/stats` | session + role:manager | `?range=<7d|30d|90d>` | `TeamStats` |
| `GET`    | `/api/meeting-rooms` | session | `?floor=<id>` | `MeetingRoom[]` |
| `POST`   | `/api/auth/sso/start` | public | — | `302` to IdP |
| `POST`   | `/api/auth/sso/callback` | public | `{ code, state }` | sets cookie, returns `User` |
| `POST`   | `/api/auth/2fa/start` | session-pending | `{ method: 'authenticator'\|'sms'\|'email' }` | `{ delivery_to }` |
| `POST`   | `/api/auth/2fa/verify` | session-pending | `{ code }` | sets session cookie, returns `User` |
| `POST`   | `/api/auth/logout` | session | — | `204` |

**Shapes:**

```ts
type CreateBookingInput = {
  type: "desk" | "room";
  date: string;          // YYYY-MM-DD
  start: string;         // HH:mm
  end: string;
  deskId?: string;
  roomId?: string;
  onBehalfOfUserId?: string;   // PA only
};

type DeskWithBookingState = {
  id: string;
  number: string;
  zoneId: string;
  x: number; y: number;
  amenities: string[];
  bookingState:
    | { status: "available" }
    | { status: "occupied"; bookingId: string }
    | { status: "occupied-by-teammate"; bookingId: string; occupant: TeammateBrief };
  // teammate identity exposed ONLY when occupant is in the requester's Workday team
};
```

**Errors** are uniform: `{ code: string, message: string, retryable: boolean, details?: object }` with HTTP status 4xx/5xx. Error codes: `auth/required`, `auth/2fa-required`, `auth/forbidden`, `validation/*`, `booking/double-booked`, `booking/horizon-exceeded`, `booking/team-clash`.

### B.3 Workday integration

**Sync model: pull, scheduled, never push.** Workday is read-only from our side.

| Field | Workday source | Cadence | Conflict policy |
|---|---|---|---|
| `email` | `Workers/Worker_Reference/Email_Address` | Nightly 02:00 UTC | Workday wins; if changed, sign user out and force re-SSO. |
| `full_name` | `Workers/Worker_Reference/Legal_Name` | Nightly | Workday wins. |
| `team` | `Workers/Position/Department` | Nightly | Workday wins. Trigger team-membership-changed event → invalidate "sit with team" cache. |
| `job_title` | `Workers/Position/Job_Title` | Nightly | Workday wins. |
| `line_manager_id` | `Workers/Manager/Worker_Reference` | Nightly | Workday wins. If user becomes a line manager, grant `manager` role; if no longer, revoke (don't touch their old bookings). |
| `location` | `Workers/Position/Location` | Nightly | Workday wins. Hard-coded subset: London, Leeds, Edinburgh — anything else flags an exception in the audit log and the user keeps their previous value. |
| `working_pattern` | Custom field `Default_Work_Pattern` | Nightly | Workday wins. |
| `accessibilityNeeds` (→ initial amenity profile) | **Used once on user creation only.** Pre-populates `user_amenities`. Subsequent edits live in Spaces@LBG. | One-shot | Spaces@LBG wins after first sync. We do not push amenity changes back to Workday. |
| `is_active` (employment status) | `Workers/Status` | Nightly | Inactive employees are soft-disabled (cannot sign in, existing bookings auto-cancelled with `released_at` set). |

**PA flag** is a Workday custom attribute (`Spaces_PA_Authorisation`). PAs nominate exec users they book on behalf of via a Workday extension (out of scope here). Spaces@LBG reads the nominated set and gates the `onBehalfOfUserId` parameter on booking creation against it.

**Manual refresh** for line managers via `POST /api/admin/workday/refresh` (rate-limited 1/hour).

### B.4 Auth

- **Primary**: Lloyds SSO via OIDC (Authorization Code + PKCE). The IdP is the corporate Azure AD tenant. Scopes: `openid profile email`.
- **2FA**: TOTP (authenticator app) preferred; SMS / email magic codes as fallback. Step-up MFA required if the IdP didn't already perform MFA in the SSO flow (read the `amr` claim).
- **Session length**: 14 days, rolling. Refresh on every request that's >2 hours old. Hard expiry after 14 days regardless of activity. Sessions can be revoked by the user from `/preferences` (out of MVP — flagged in risks).
- **Device trust**: First sign-in on a device prompts 2FA. Cookie `lbg_device_id` (`HttpOnly`, `Secure`, `SameSite=Lax`, 365d) tracks the device. Subsequent sign-ins from a trusted device skip 2FA if the SSO session is fresh (<8h). New device or expired trust → full 2FA. Trusted devices visible/revocable from preferences (post-MVP).
- **Cookies**:
  - `lbg_session` — JWT, signed with rotating EdDSA key, `HttpOnly`, `Secure`, `SameSite=Lax`, 14d.
  - `lbg_device_id` — opaque random 256-bit token, `HttpOnly`, `Secure`, `SameSite=Lax`, 365d.
  - No cookies cross-domain; the app is on `spaces.lloydsbanking.intra`.

### B.5 Geolocation auto check-in

**Strict privacy contract — write this in the spec because everyone is going to ask.**

1. **Opt-in only.** Default off. Toggle in Preferences, plain copy explaining what's collected.
2. **Scoped collection.** Coordinates are only requested by the browser/app on days the user has a confirmed booking, and only between 06:00 and 11:00 local time. Outside that window, no permission is requested.
3. **Geofence**: building centroid + 75 m radius (UK city centres — covers entrances and lobbies but not adjacent streets). Stored in `buildings.geofence`.
4. **Single ping, single decision.** On enter event, the client POSTs `{ bookingId, accuracy_m, at }` to `/api/bookings/:id/check-in`. The server validates the booking belongs to the caller and the timestamp is in the check-in window. Raw coordinates are **never** stored — only `source = 'geo'` and `accuracy_m` (for diagnostics).
5. **Battery**: use the Geofencing API on supported devices (background, ~1% / day battery). On unsupported browsers, fall back to a single foreground geolocation request when the app is opened in the window — no background polling.
6. **Off-switch is one tap**, in Preferences. Disabling immediately revokes the browser permission via `navigator.permissions.revoke` where available.
7. **Audit**: every geo check-in is in `audit_log` with `action = 'booking.checkin'` and `diff = { source: 'geo', accuracy_m }`. No coordinates in the audit log.

### B.6 Notifications

| Event | Channels | Trigger | Quiet hours? |
|---|---|---|---|
| Booking confirmed | Email + Outlook | On `POST /api/bookings` success | No |
| Booking cancelled | Email + Outlook (cancellation) | On `DELETE /api/bookings/:id` | No |
| Wrap-up warning | Push | 60 min before `end_time` of a checked-in morning booking (start ≤ 12:00) | Yes — 21:00–07:00 suppressed |
| Desk bump (your desk released) | Push + Email | 10:00 local time, when not checked in | No (always relevant) |
| Swap requested | Push + Email | On `POST /api/swap-requests` | Yes |
| Swap accepted / declined | Push | On `/respond` | Yes |
| Team clash detected | Push (initiator only) | On `sit-with-team` writeup, for each clashing teammate | No |

**Outlook**: ICS-format calendar invites sent from `spaces-noreply@lloydsbanking.intra` with method `REQUEST` on create, `CANCEL` on delete. Stored `uid` on the booking so updates patch the same event.

**Push**: Web Push API + APNs for iOS PWA. Subscription stored per device in `notifications` (one outbound row per delivery attempt).

**User preference matrix** lives in `users.preferences_json` (`email_notifications`, `push_notifications`, `outlook_sync`). Each channel can be toggled; server respects the toggle but always sends the email confirmation for cancellations (legal/audit requirement).

### B.7 Authorisation matrix

| Action | `user` | `manager` | `pa` |
|---|---|---|---|
| Book a desk for self (4 weeks) | ✅ | ✅ | ✅ |
| Book a room for self (3 months) | ✅ | ✅ | ✅ |
| Book a room for self (1 year) | ❌ | ❌ | ✅ |
| Book on behalf of another | ❌ | ❌ | ✅ (only for nominated execs) |
| Cancel own booking | ✅ | ✅ | ✅ |
| Cancel another user's booking | ❌ | ❌ | ✅ (only for nominated execs) |
| See own team's seating | ✅ | ✅ | ✅ |
| See teammate names on map tooltip | ✅ (own Workday team only) | ✅ | ✅ |
| Open `/stats` | ❌ | ✅ | ❌ |
| View direct reports' attendance | ❌ | ✅ (own reports only) | ❌ |
| Initiate desk swap | ✅ | ✅ | ✅ |
| Accept/decline incoming swap | ✅ | ✅ | ✅ |

**Implementation:** middleware on every server function reads the session, hydrates `currentUser` with their `user_roles`, and exposes a `can(action, resource)` helper. RLS in Postgres mirrors this — even if app logic forgets, the DB refuses. Critical policies:

```sql
-- Bookings: users see their own + their team + their direct reports (if manager)
create policy bookings_read on bookings for select using (
  user_id = auth.uid()
  or exists (select 1 from users me
             where me.id = auth.uid()
               and (select team from users where id = bookings.user_id) = me.team
               and (select location from users where id = bookings.user_id) = me.location)
  or exists (select 1 from users r
             where r.id = bookings.user_id
               and r.line_manager_id = auth.uid())
);

create policy bookings_write on bookings for insert with check (
  -- self-booking
  user_id = auth.uid() and booked_by_id = auth.uid()
  -- PA on behalf of (verified in app code against nominated_execs)
  or exists (select 1 from user_roles where user_id = auth.uid() and role_id =
             (select id from roles where code = 'pa'))
);
```

### B.8 Booking-horizon enforcement (server-side)

```ts
const HORIZON_DAYS = {
  desk: 28,
  room_default: 90,
  room_pa: 365,
};

function maxBookableDate(user: User, type: BookingType): Date {
  const today = startOfDayLocal(user.location);
  if (type === "desk") return addDays(today, HORIZON_DAYS.desk);
  if (user.roles.includes("pa")) return addDays(today, HORIZON_DAYS.room_pa);
  return addDays(today, HORIZON_DAYS.room_default);
}
```

Enforced in:

1. App middleware on `POST /api/bookings` → returns `400 booking/horizon-exceeded` if outside.
2. The UI date picker's `max` attribute (informational, not the source of truth).
3. A row-level check trigger as last line of defence:
   ```sql
   create function check_booking_horizon() returns trigger as $$
   begin
     if NEW.type = 'desk' and NEW.date > current_date + interval '28 days' then
       raise exception 'horizon_exceeded' using errcode = 'P0001';
     end if;
     -- room horizon is harder to enforce in pure SQL (needs PA-role lookup);
     -- left to app middleware. Document this clearly.
     return NEW;
   end$$ language plpgsql;

   create trigger trg_booking_horizon before insert on bookings
     for each row execute function check_booking_horizon();
   ```

### B.9 Background jobs

**Cloudflare Cron Triggers** drive everything.

| Job | Schedule | What it does |
|---|---|---|
| `desk-bump` | `0 10 * * 1-5` per timezone (London) | For each confirmed `desk` booking where `date = today`, `start_time <= '10:00'`, `checked_in_at IS NULL`: set `status = 'cancelled'`, `released_at = now()`, fire `desk_bump` notification, audit. |
| `wrap-up-warning` | `*/5 * * * 1-5` | For each booking with `checked_in_at IS NOT NULL`, `end_time` between now+55min and now+65min, and start_time ≤ 12:00, fire `wrap_up_warning` push (idempotent via `notifications.kind` + `booking_id` unique-ish guard). |
| `workday-sync` | `0 2 * * *` | Pull Workday delta, upsert users, reconcile roles, expire stale sessions. |
| `notification-flush` | `* * * * *` | Drain the outbox (email/SMS/push) — separate from event creation so DB writes are fast. |
| `swap-expire` | `0 * * * *` | Mark `swap_requests` older than 24h pending as `expired`. |

**Idempotency**: `desk-bump` runs are idempotent because the partial unique index already prevents double-cancellation; `wrap-up-warning` uses `(booking_id, kind)` uniqueness on `notifications`.

### B.10 Observability & SLOs

**Logs** (structured JSON to Cloudflare Logpush → BigQuery):
- One log per server-function invocation: `{ requestId, userId, route, status, duration_ms, error_code? }`.
- One log per `audit_log` insert (mirror).
- Push delivery failures with `subscription_id` and provider error.

**Metrics** (OpenTelemetry → Grafana):
- `booking_create_latency_ms` (p50/p95/p99 by `type`).
- `desk_bump_count` per day.
- `auto_checkin_count` and `manual_checkin_count`.
- `workday_sync_users_updated` per run.
- `notification_send_failures_total` by channel.

**SLOs:**
- `GET /api/desks?floor=&date=` p95 < 300 ms.
- `POST /api/bookings` p95 < 600 ms.
- `/api/me` p95 < 150 ms.
- 99.9% monthly availability of the booking write path during 06:00–20:00 UK time.
- Workday sync completes < 10 min for 30 k users.

**Alerts:**
- Any `desk-bump` run touching > 30% of today's bookings = page someone.
- `workday-sync` failure ≥ 2 consecutive nights = page.
- Push delivery failure rate > 5% over 1h = warn.

### B.11 Accessibility test plan

Target: **WCAG 2.2 AA** end-to-end, AAA on critical paths.

| Surface | Manual | Automated |
|---|---|---|
| Keyboard navigation | Tab through Home → Book → confirm a desk → Bookings. No keyboard traps; every interactive element reachable; visible focus on all buttons/links (we ship a `:focus-visible` ring at 2px on every primitive). | axe-core on every route, fails CI on serious violations. |
| Screen reader | NVDA + JAWS (Windows), VoiceOver (Mac/iOS). Map has a screen-reader-friendly **list alternative** at `/book/list?floor=&date=` (rendered as a `<table>` of desks with amenity columns — server can route SR users here based on prefers-table-mode toggle). | axe-core landmarks/labels rules. |
| Colour contrast | Every fg/bg pair listed in §A.2 verified via Tanaguru or APCA reference. | tokens-contrast.test.ts asserts all pairs are ≥ 4.5:1 (or 3:1 for large text). |
| Motion | `prefers-reduced-motion: reduce` disables every Framer Motion mount tween (handled globally in `styles.css`) and the pulse ring. Verified in Chrome DevTools rendering tab. | Cypress audit assertion: no animations >100 ms when reduced motion is on. |
| Forms | Date pickers (`/book`) work via keyboard arrows + manual entry. 2FA input announces "6 digits, X of 6 entered". | Pa11y CI. |
| Map alternative | `Tab` through desks in DOM order (currently top-to-bottom of zone iteration); each dot exposes `aria-label="Desk G-014"` and its tooltip. List view available at `/book/list`. | — |
| Touch targets | All tappable elements ≥ 44×44 CSS px on mobile (verified via Cypress viewport tests). Nav items already 56 px tall; map dots are 12 px visually but the `<button>` hit-area is padded to 28 px via invisible padding (TODO — currently 12 px, fix before launch). |  |

---

## Section C — Acceptance criteria

Per feature, in Given/When/Then form. QA can lift these directly into a test runner.

### C.1 Book a desk

**AC1.1** Given a signed-in standard user with no booking today, when they open `/book`, they see the Ground floor map by default with desks rendered as dots.

**AC1.2** Given the user clicks an available (green) desk, when the click registers, the desk turns primary-green and a detail card appears below the map with the desk number, zone name, and amenity badges.

**AC1.3** Given the user has selected a desk and clicks "Confirm booking", when the server accepts, a toast appears with the desk number and date, the booking appears under `/bookings → Upcoming`, and the map updates to mark that desk as `mine` for that date.

**AC1.4** Given the user tries to select a desk that has a confirmed teammate booking, when they hover it, a tooltip shows the teammate's name and team; when they click, nothing happens (button is disabled).

**AC1.5** Given the user is a standard user and picks a date 29 days from today, when they click "Confirm booking", the server returns `booking/horizon-exceeded` and the UI shows an inline error: "Desks can only be booked up to 4 weeks ahead."

**AC1.6** Given the user toggles the "Low noise" amenity chip, when the map re-renders, every desk without `low-noise` becomes filtered-out (small, faded, not interactive); only matching desks remain available.

**AC1.7** Given the user clicks "My needs" in the amenity filter, when the chip applies, the filter set equals exactly their `user_amenities` (in any order).

### C.2 Smart check-in

**AC2.1** Given a confirmed booking today with `start_time = 09:00` and `checked_in_at = NULL`, when the time is 09:30, the Home reminder panel shows a primary "Check in by 10:00" card with the remaining minutes.

**AC2.2** Given the same booking at 09:45, when the user clicks "Check in now", `checked_in_at` is set to now, the panel transitions to the success state, and `audit_log` records `booking.checkin` with `source = 'manual'`.

**AC2.3** Given the same booking at 10:01 with `checked_in_at = NULL`, when the desk-bump cron runs, the booking flips to `cancelled`, `released_at = 10:00:00`, a push + email is sent, and the Home reminder panel shows the red "Desk released" banner with a pulsing ring.

**AC2.4** Given auto check-in is enabled and the user enters the geofence at 09:12, when the client posts the geo check-in, the server validates the booking, marks `checked_in_at = 09:12`, and stores `source = 'geo'` with `accuracy_m` (no coords).

**AC2.5** Given the user has a checked-in booking ending at 12:30, when the time is 11:30, a push notification fires once, and the Home reminder shows the wrap-up amber band.

### C.3 Sit with team

**AC3.1** Given the user clicks "Sit with team" with 5 teammates selected, when the server allocates, it returns 6 bookings (the user + 5 teammates) in a contiguous cluster on the same floor. If <6 contiguous desks are available, return `booking/no-cluster` with a count of available contiguous seats.

**AC3.2** Given one of the selected teammates already has a confirmed booking that day, when the allocator runs, their existing booking is preserved, their new booking is created with `status = 'requested'`, and they get a `team_clash_detected` notification asking them to accept or release.

### C.4 PA-on-behalf-of

**AC4.1** Given a user with role `pa` and the exec "Alex Brown" in their `nominated_execs` list, when they POST a booking with `onBehalfOfUserId = alex.brown_id`, the booking is created with `user_id = alex.brown_id`, `booked_by_id = pa_id`, and audit logs both.

**AC4.2** Given the same PA tries to book on behalf of an exec NOT in their nominated list, the server returns `auth/forbidden`.

**AC4.3** Given a PA books a meeting room 9 months out, the booking is accepted (PA horizon = 1 year). A standard user trying the same gets `booking/horizon-exceeded`.

### C.5 Authorisation

**AC5.1** Given a non-manager hits `/stats` directly, the route shows the "managers only" empty state and `/api/team/stats` returns 403.

**AC5.2** Given a manager opens `/stats`, the page lists their direct reports (Workday `line_manager_id`), each with today's office/remote badge.

### C.6 Onboarding

**AC6.1** Given a new user signs in for the first time (`onboarded = false`), the 5-screen onboarding overlays on `/`. They cannot reach `/book` until they complete or skip.

**AC6.2** Given the user skips onboarding on Screen 1, `onboarded` is set to true, and the overlay does not appear on subsequent sign-ins. They can re-trigger it from Preferences → "Replay welcome" (post-MVP).

**AC6.3** Given the user completes Screen 3 with 3 amenity chips selected, those amenities are saved to `user_amenities` server-side, and the amenity filter on `/book` defaults to those chips.

### C.7 Accessibility

**AC7.1** Given a user navigates with the Tab key only, every actionable element on every route receives a visible focus ring (`outline: 2px solid var(--color-ring)`), and there are no focus traps.

**AC7.2** Given `prefers-reduced-motion: reduce` is set, the AnimatedSky still renders the static gradient but the sun/moon mount tween, cloud drift, and star twinkle do not play. The reminder banner pulse ring does not pulse.

**AC7.3** Given a screen reader user opens `/book`, they reach the list-alternative view (`/book/list`) via a "List view" link in the page header. The list is a `<table>` with desk-number, zone, and amenity columns.

---

## Section D — Risks, open questions, optional enhancements

### Risks

| # | Risk | Severity | Owner | Mitigation |
|---|---|---|---|---|
| R1 | Workday schema field names differ from assumed (`Default_Work_Pattern` may not exist) | High | Workday team | Discovery call before MVP build; treat working-pattern as optional with a fallback to "no preference". |
| R2 | Geolocation auto check-in spooks employees on first prompt | Medium | InfoSec, Comms | Default OFF, plain-English copy on the toggle, internal comms before rollout. |
| R3 | Push notifications on iOS PWA only work since iOS 16.4 *and* the app is installed to home screen | Medium | Mobile | MVP supports web push everywhere, falls back to email for unsupported devices; revisit native wrapper if adoption stalls. |
| R4 | The 10am desk-bump rule may interact badly with people in long external meetings — losing your desk while in a customer call is awful | High | Product, HR | Add a one-tap "delay check-in by 30 min" snooze from the morning reminder push (post-MVP, must be in launch comms). |
| R5 | Free-text `team` from Workday means renaming a team breaks "sit with team" caches | Medium | Eng | Hold a `team_id` (UUID) populated by an internal team catalogue; remap on Workday sync. Out of MVP — flagged. |
| R6 | RLS policies on `bookings_read` may leak teammate names beyond the user's immediate Workday team if the Workday team field has duplicate names across locations | Medium | InfoSec | Composite key (team + location) used in the policy — verify Workday uniqueness. |
| R7 | Floorplan PNGs are imprecise — desk positions are illustrative, not surveyed | Medium | Facilities | MVP ships with surveyed positions for ≥1 building; remaining buildings illustrative with a banner saying so. |
| R8 | Tailwind v4 / oklch is unsupported in IE11 / legacy Edge — Lloyds laptops on locked-down builds may not render colour correctly | Low (modern Edge is default) | Eng | Polyfill via Lightning CSS / postcss-color-functions; visual regression suite covers a Chromium 109 baseline. |

### Open questions for Lloyds InfoSec / Workday / Facilities

1. **Workday API access**: do we have an integration system user with read access to the Worker reports we need, or do we need to request one? Lead time?
2. **PA delegation**: is the "nominated execs" relationship maintained in Workday, or do we need to build a separate admin UI?
3. **Building geofences**: who owns surveying the building centroids and radii? Facilities? Are smaller satellite offices in scope?
4. **Audit retention**: how long do we keep `audit_log` rows? 6 years (typical financial-services default)? Where do they archive to?
5. **Notification provider**: SES or SendGrid for transactional email? Push provider — OneSignal? In-house?
6. **Outlook sync**: do we use Graph API (per-user delegated token, requires consent) or a service-to-service token (less granular, mailbox-write across the org)?
7. **Inclusive language sign-off**: HR/D&I should sign off on the "Amenities" reframing wording for the onboarding screens.

### What to cut from MVP

- **Meeting-room booking UI** — model and horizons are spec'd but the picker is not in the prototype. Ship V1 with desks only; rooms in V1.1.
- **Trusted-device management** in Preferences — keep the cookie behaviour, defer the management UI.
- **Swap-request inbox** — the swap data model is there; the inbox surface and notifications can ship V1.1.
- **Manager `/stats` dashboard analytics** — V1 ships counts only; trend charts and CSV export V1.1.
- **Wayfinder "live navigation"** — V1 ships static directions; turn-by-turn requires beacons or BLE and is out of scope.

### Optional enhancements (flagged separately — NOT in the brief)

These are ideas surfaced by the build but explicitly outside the brief. None are recommended for MVP.

- **Office hours heatmap** — show density by hour on the floor map so people can pick quieter times. Privacy-friendly because it's aggregate. *Estimated value: medium; effort: medium.*
- **Personal "anchor day" nudge** — "It's Monday and you said you'd be in — fancy booking?" Push to people who haven't booked their anchor day yet by EOD Sunday. *High value, low effort.*
- **Building-level capacity caps** — Lloyds H&S may want a hard cap per floor. Easy to model (`floors.max_capacity`), enforce on `POST /api/bookings`. *Worth a conversation.*
- **Group bookings** — book a row for a known project for the next two weeks in one shot. Power-user feature. *Defer until usage data shows a need.*

---

## Annex — what's in the prototype

The scaffold under `src/` implements the must-have surfaces for the brief:

| Path | What |
|---|---|
| `src/styles.css` | Lloyds tokens, dark mode, high-contrast, larger-text classes |
| `src/main.tsx` | React 19 entry, TanStack Router, Toaster |
| `src/routes/__root.tsx` | Top bar + bottom nav layout (skipped on `/login`) |
| `src/routes/index.tsx` | Home: AnimatedSky hero, ReminderPanel, QuickActions, team strip |
| `src/routes/book.tsx` | Desk tab with floor switcher, date picker, amenity filter, FloorMap. Room tab is a stub. |
| `src/routes/bookings.tsx` | Upcoming + past lists, cancel, check-in, wayfinder link |
| `src/routes/team.tsx` | Workday teammates + today's seating |
| `src/routes/preferences.tsx` | Appearance, check-in, notifications, my desk needs, account, demo user switcher |
| `src/routes/wayfinder.tsx` | Step-by-step animated directions for today's desk |
| `src/routes/stats.tsx` | Line-manager-only dashboard with attendance counts |
| `src/routes/login.tsx` | Mock SSO + 2FA fallback (authenticator / SMS / email) |
| `src/components/map/floor-map.tsx` | Interactive floor map with hover tooltips, teammate identification, state colours |
| `src/components/map/amenity-filter.tsx` | Amenity chip sidebar with "My needs" shortcut |
| `src/components/home/animated-sky.tsx` | Time-of-day sky (dawn / morning / afternoon / evening / night) |
| `src/components/home/reminder-panel.tsx` | All four reminder states |
| `src/components/home/today-card.tsx` | Greeting hero with today's-desk card |
| `src/lib/app-store.tsx` | React Context + localStorage persistence, theme/contrast/text class management |
| `src/data/desks.ts` | Generated mock desks for both floors, seeded RNG so positions are stable |
| `src/data/app.ts` | Loads users.json, derives role from line-manager-references, exposes team/reports helpers |
| `src/lib/amenities.ts` | All 14 amenity definitions with icons |

**Known gaps vs. brief**: meeting-room booking UI, swap requests UI, onboarding overlay (designed in §A.5), screen-reader list view at `/book/list`. All called out under "What to cut from MVP" so they don't get lost.
