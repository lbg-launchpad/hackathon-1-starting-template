// My Bookings: list of current + upcoming with cancel + check in/out.

import { el } from "../components/ui.js";
import {
  getState,
  currentUser,
  fmtTime,
  fmtDate,
  todayISO,
  deskById,
  update,
} from "../store.js";
import { LOCATIONS } from "../data.js";
import { sendCancellationEmail } from "../email.js";
import { navigate } from "../router.js";

export function BookingsView() {
  const root = el("div", { class: "view view--bookings" });
  const me = currentUser();
  if (!me) return el("div", { class: "empty", text: "Loading…" });

  const today = todayISO();
  const all = getState().bookings
    .filter((b) => b.userId === me.id)
    .sort((a, b) => (a.date + " " + a.startMin).localeCompare(b.date + " " + b.startMin));

  const upcoming = all.filter((b) => b.date >= today && b.status !== "cancelled");
  const past = all.filter((b) => b.date < today || b.status === "cancelled").slice(-10);

  root.appendChild(el("h2", { style: { marginBottom: "12px", fontSize: "20px" }, text: "My bookings" }));

  if (!upcoming.length) {
    root.appendChild(el("div", { class: "empty" }, [
      el("h3", { text: "No upcoming bookings" }),
      el("p", { text: "Book a desk to get started." }),
      el("div", { style: { marginTop: "12px" } }, [el("a", { class: "btn", href: "#/book", text: "Book a space" })]),
    ]));
  } else {
    root.appendChild(el("div", { class: "section-h", text: "Upcoming" }));
    upcoming.forEach((b) => root.appendChild(bookingRow(b)));
  }

  if (past.length) {
    root.appendChild(el("div", { class: "section-h", text: "Recent" }));
    past.forEach((b) => root.appendChild(bookingRow(b, true)));
  }

  return root;
}

function bookingRow(b, isPast = false) {
  const desk = deskById(b.deskId);
  const loc = LOCATIONS.find((l) => l.id === desk?.locationId)?.name || "";
  const me = currentUser();
  const isToday = b.date === todayISO();
  const cancelled = b.status === "cancelled";
  return el("div", { class: "row" }, [
    el("div", { class: "row__main" }, [
      el("div", { class: "row__title" }, [
        `Desk ${desk?.number || "?"} • ${desk?.zone || ""}`,
        cancelled ? el("span", { class: "badge badge--danger", style: { marginLeft: "8px" } }, "Cancelled") : null,
        b.teamFor && b.teamFor !== me.id ? el("span", { class: "badge", style: { marginLeft: "8px" } }, "Booked for you") : null,
      ]),
      el("div", { class: "row__sub", text: `${fmtDate(b.date)} • ${fmtTime(b.startMin)}–${fmtTime(b.endMin)} • ${loc}` }),
    ]),
    el("div", { class: "row__actions" },
      isPast || cancelled
        ? []
        : [
            isToday
              ? (b.checkedIn
                  ? el("button", { class: "btn btn--ghost btn--sm", onclick: () => toggleCheckIn(b.id, false) }, "Check out")
                  : el("button", { class: "btn btn--sm", onclick: () => toggleCheckIn(b.id, true) }, "Check in"))
              : null,
            el("button", { class: "btn btn--ghost btn--sm", onclick: () => cancelBooking(b.id) }, "Cancel"),
          ],
    ),
  ]);
}

function toggleCheckIn(id, value) {
  update((s) => {
    const b = s.bookings.find((x) => x.id === id);
    if (b) b.checkedIn = value;
  });
  navigate();
}

function cancelBooking(id) {
  const booking = getState().bookings.find((b) => b.id === id);
  if (!booking) return;
  update((s) => { const b = s.bookings.find((x) => x.id === id); if (b) b.status = "cancelled"; });
  sendCancellationEmail(booking);
  navigate();
}
