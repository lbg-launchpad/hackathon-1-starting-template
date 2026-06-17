// My Team: Workday colleague list, today's seating, "sit with" suggestion.

import { el, toast } from "../components/ui.js";
import {
  getState,
  currentUser,
  fmtTime,
  todayISO,
  deskById,
  update,
} from "../store.js";

export function TeamView() {
  const root = el("div", { class: "view view--team" });
  const me = currentUser();
  if (!me) return el("div", { class: "empty", text: "Loading…" });

  const teammates = getState().users.filter((u) => u.team === me.team && u.id !== me.id);
  const today = todayISO();

  root.appendChild(el("h2", { style: { marginBottom: "4px", fontSize: "20px" }, text: `${me.team}` }));
  root.appendChild(el("p", { style: { margin: "0 0 16px", color: "var(--c-fg-muted)", fontSize: "13px" }, text: `${teammates.length} colleagues • from Workday` }));

  // Today's seating
  const seatedToday = teammates.map((t) => {
    const booking = getState().bookings.find(
      (b) => b.userId === t.id && b.date === today && b.status !== "cancelled",
    );
    return { user: t, booking, desk: booking ? deskById(booking.deskId) : null };
  });

  const inToday = seatedToday.filter((s) => s.booking);
  if (inToday.length) {
    root.appendChild(el("div", { class: "section-h", text: "In the office today" }));
    for (const s of inToday) {
      root.appendChild(el("div", { class: "row" }, [
        el("span", { class: "avatar", text: s.user.initials }),
        el("div", { class: "row__main" }, [
          el("div", { class: "row__title", text: s.user.name }),
          el("div", { class: "row__sub", text: `${s.user.role} • Desk ${s.desk?.number || "?"} • ${s.desk?.zone || ""} • ${fmtTime(s.booking.startMin)}–${fmtTime(s.booking.endMin)}` }),
        ]),
      ]));
    }
  }

  root.appendChild(el("div", { class: "section-h", text: "All teammates" }));
  for (const t of teammates) {
    root.appendChild(el("div", { class: "row" }, [
      el("span", { class: "avatar", text: t.initials }),
      el("div", { class: "row__main" }, [
        el("div", { class: "row__title", text: t.name }),
        el("div", { class: "row__sub", text: `${t.role}` }),
      ]),
      el("button", { class: "btn btn--ghost btn--sm", onclick: () => addToTeamBooking(t.id) }, "Add to team booking"),
    ]));
  }

  return root;
}

function addToTeamBooking(userId) {
  update((s) => {
    s.bookingDraft.forTeam = true;
    if (!s.bookingDraft.teammates.includes(userId)) s.bookingDraft.teammates.push(userId);
  });
  toast("Added to team booking — head to Book", "success");
  setTimeout(() => { location.hash = "#/book"; }, 300);
}
