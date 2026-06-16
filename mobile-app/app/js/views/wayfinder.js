// Wayfinder: simple animated step-by-step directions to your booked desk.

import { el } from "../components/ui.js";
import { getState, currentUser, todayISO, deskById, fmtTime } from "../store.js";
import { LOCATIONS } from "../data.js";

export function WayfinderView() {
  const root = el("div", { class: "view view--wayfinder" });
  const me = currentUser();
  if (!me) return el("div", { class: "empty", text: "Loading…" });

  const today = todayISO();
  const booking = getState().bookings.find((b) => b.userId === me.id && b.date === today && b.status !== "cancelled");
  if (!booking) {
    root.appendChild(el("div", { class: "empty" }, [
      el("h3", { text: "Nothing to find today" }),
      el("p", { text: "Wayfinder activates once you've booked a desk for today." }),
      el("div", { style: { marginTop: "12px" } }, [el("a", { class: "btn", href: "#/book", text: "Book a space" })]),
    ]));
    return root;
  }
  const desk = deskById(booking.deskId);
  const loc = LOCATIONS.find((l) => l.id === desk.locationId)?.name || desk.locationId;

  root.appendChild(el("section", { class: "card" }, [
    el("h2", { style: { fontSize: "20px", marginBottom: "4px" }, text: `Desk ${desk.number}` }),
    el("p", { style: { color: "var(--c-fg-muted)", margin: "0 0 12px" }, text: `${loc} • ${desk.floorId === "ground" ? "Ground" : "First"} floor • ${desk.zone} • ${fmtTime(booking.startMin)}–${fmtTime(booking.endMin)}` }),
    el("ol", { style: { paddingLeft: "18px", margin: 0, lineHeight: 1.7, fontSize: "14px" } }, [
      el("li", null, "Enter through the main reception and tap your pass."),
      el("li", null, `Take ${desk.floorId === "ground" ? "no lift — desk is on the ground floor" : "the lifts or stairs to the first floor"}.`),
      el("li", null, `Follow signs to the ${desk.zone}.`),
      el("li", null, `Your desk is desk ${desk.number}.`),
    ]),
  ]));

  return root;
}
