// Home: contextual greeting, today's booking with check-in/out, reminders.

import { el, toast } from "../components/ui.js";
import {
  getState,
  currentUser,
  todayISO,
  fmtTime,
  fmtDate,
  deskById,
  update,
} from "../store.js";
import { navigate } from "../router.js";
import { LOCATIONS } from "../data.js";

function greetingFor(hour) {
  if (hour < 5)  return { word: "Working late",   sub: "Office is quiet — take it easy.", bg: "night" };
  if (hour < 12) return { word: "Good morning",   sub: "Hope your day is off to a calm start.", bg: "morning" };
  if (hour < 17) return { word: "Good afternoon", sub: "Halfway there.", bg: "afternoon" };
  if (hour < 21) return { word: "Good evening",   sub: "Wrapping up?", bg: "evening" };
  return { word: "Goodnight",                     sub: "Rest well.", bg: "night" };
}

function skySvg(kind) {
  if (kind === "morning" || kind === "afternoon") {
    return `<svg width="84" height="84" viewBox="0 0 100 100" fill="none">
      <circle cx="55" cy="35" r="20" fill="#fff" opacity="0.95"/>
      <ellipse cx="30" cy="60" rx="22" ry="8" fill="#fff" opacity="0.45"/>
      <ellipse cx="68" cy="68" rx="18" ry="6" fill="#fff" opacity="0.3"/>
    </svg>`;
  }
  // evening / night — moon + stars
  return `<svg width="84" height="84" viewBox="0 0 100 100" fill="none">
    <path d="M65 25 a25 25 0 1 0 18 38 a20 20 0 0 1 -18 -38z" fill="#fff" opacity="0.92"/>
    <circle cx="22" cy="40" r="1.4" fill="#fff" opacity="0.9"/>
    <circle cx="34" cy="22" r="1.2" fill="#fff" opacity="0.8"/>
    <circle cx="12" cy="60" r="1" fill="#fff" opacity="0.7"/>
  </svg>`;
}

export function HomeView() {
  const root = el("div", { class: "view view--home" });
  const user = currentUser();
  if (!user) return el("div", { class: "empty", text: "Loading…" });

  const now = new Date();
  const greet = greetingFor(now.getHours());

  const hero = el("section", { class: "hero", "aria-label": "Greeting" }, [
    el("div", { class: `hero__bg hero__bg--${greet.bg}` }),
    el("div", { class: "hero__sky", html: skySvg(greet.bg) }),
    el("div", { class: "hero__greet", text: `${greet.word},` }),
    el("div", { class: "hero__name", text: user.name.split(" ")[0] }),
    el("div", { class: "hero__sub", text: greet.sub }),
  ]);
  root.appendChild(hero);

  // Today's booking(s)
  const today = todayISO();
  const myBookings = getState().bookings
    .filter((b) => b.userId === user.id && b.date === today && b.status !== "cancelled")
    .sort((a, b) => a.startMin - b.startMin);

  const todayCard = el("section", { class: "card" }, [
    el("div", { class: "card__title" }, [
      el("h2", { text: "Today" }),
      el("span", { class: "badge", text: fmtDate(today) }),
    ]),
    myBookings.length === 0
      ? el("div", { style: { padding: "8px 0" } }, [
          el("p", { text: "You're not booked in today.", style: { margin: "0 0 12px", color: "var(--c-fg-soft)" } }),
          el("a", { class: "btn", href: "#/book", text: "Book a space" }),
        ])
      : el("div", null, myBookings.map(renderTodayRow)),
  ]);
  root.appendChild(todayCard);

  // 10am desk-bump reminder when not yet checked in
  const needsCheckIn = myBookings.find(
    (b) => !b.checkedIn && b.startMin <= 10 * 60 && (now.getHours() * 60 + now.getMinutes()) < 10 * 60,
  );
  if (needsCheckIn) {
    root.appendChild(el("div", { class: "reminder", style: { marginTop: "12px" } }, [
      el("div", { class: "reminder__dot" }),
      el("div", null, [
        el("div", { style: { fontWeight: 700, marginBottom: "2px" } }, "Check in by 10:00 AM"),
        el("div", { style: { fontSize: "13px", color: "var(--c-fg-soft)" } }, "Desks not checked in by 10am are released automatically. You can check in from this page when you arrive."),
      ]),
    ]));
  }

  // Upcoming bookings (next 7 days, excluding today)
  const horizonEnd = new Date(); horizonEnd.setDate(horizonEnd.getDate() + 14);
  const upcoming = getState().bookings
    .filter((b) => b.userId === user.id && b.status !== "cancelled" && b.date > today && new Date(b.date) <= horizonEnd)
    .sort((a, b) => (a.date + " " + a.startMin).localeCompare(b.date + " " + b.startMin))
    .slice(0, 4);
  if (upcoming.length) {
    const card = el("section", { class: "card", style: { marginTop: "12px" } }, [
      el("div", { class: "card__title" }, [
        el("h2", { text: "Upcoming" }),
        el("a", { class: "badge", href: "#/bookings", text: "View all" }),
      ]),
      el("div", null, upcoming.map((b) => {
        const desk = deskById(b.deskId);
        const loc = LOCATIONS.find((l) => l.id === desk?.locationId)?.name || "";
        return el("div", { class: "row" }, [
          el("div", { class: "row__main" }, [
            el("div", { class: "row__title", text: `Desk ${desk?.number || "?"} • ${desk?.zone || ""}` }),
            el("div", { class: "row__sub", text: `${fmtDate(b.date)} • ${fmtTime(b.startMin)}–${fmtTime(b.endMin)} • ${loc}` }),
          ]),
        ]);
      })),
    ]);
    root.appendChild(card);
  }

  // Quick actions
  root.appendChild(el("div", { class: "section-h", text: "Quick actions" }));
  root.appendChild(el("div", { class: "grid-2" }, [
    quickLink("Book a desk", "#/book", `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 3v4M16 3v4M3 11h18"/>`),
    quickLink("My team", "#/team", `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>`),
    quickLink("Wayfinder", "#/wayfinder", `<path d="M9 20l-6-6 6-6M9 14h12"/>`),
    quickLink("Profile", "#/profile", `<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>`),
  ]));

  return root;
}

function renderTodayRow(b) {
  const desk = deskById(b.deskId);
  const checkedIn = b.checkedIn;
  return el("div", { class: "today" }, [
    el("div", { class: "today__main" }, [
      el("div", { class: "today__desk", text: `Desk ${desk?.number || "?"}` }),
      el("div", { class: "today__meta", text: `${desk?.zone || ""} • ${b.label || ""} • ${fmtTime(b.startMin)}–${fmtTime(b.endMin)}` }),
    ]),
    el("div", { class: "today__actions" },
      checkedIn
        ? [
            el("span", { class: "badge", text: "Checked in" }),
            el("button", { class: "btn btn--ghost btn--sm", onclick: () => doCheckOut(b.id) }, "Check out"),
          ]
        : [
            el("button", { class: "btn btn--sm", onclick: () => doCheckIn(b.id) }, "Check in"),
          ],
    ),
  ]);
}

function doCheckIn(bookingId) {
  update((s) => {
    const b = s.bookings.find((x) => x.id === bookingId);
    if (b) b.checkedIn = true;
  });
  toast("Checked in — have a great day", "success");
  navigate();
}

function doCheckOut(bookingId) {
  update((s) => {
    const b = s.bookings.find((x) => x.id === bookingId);
    if (b) b.checkedIn = false;
  });
  toast("Checked out — desk released for the rest of the slot", "default");
  navigate();
}

function quickLink(label, href, svgPath) {
  return el("a", {
    class: "card",
    href,
    style: { display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" },
  }, [
    el("span", {
      style: { width: "40px", height: "40px", borderRadius: "12px", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--c-brand-soft)", color: "var(--c-brand)" },
      html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>`,
    }),
    el("div", null, [
      el("div", { style: { fontWeight: 600, fontSize: "14px" } }, label),
      el("div", { style: { fontSize: "12px", color: "var(--c-fg-muted)" } }, "Open"),
    ]),
  ]);
}
