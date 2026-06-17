// Wayfinder: simple animated step-by-step directions to your booked desk.

import { el } from "../components/ui.js";
import { getState, currentUser, todayISO, deskById, fmtTime } from "../store.js";
import { LOCATIONS, FLOORS } from "../data.js";

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
    root.appendChild(browseFloorPlans());
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

function browseFloorPlans() {
  const wrap = el("section", { class: "card", style: { marginTop: "12px" } });

  wrap.appendChild(el("h3", { style: { margin: "0 0 4px", fontSize: "18px" }, text: "Browse floor plans" }));
  wrap.appendChild(el("p", {
    style: { margin: "0 0 12px", color: "var(--c-fg-muted)", fontSize: "13px" },
    text: "Just want a look around? Pick a site.",
  }));

  let locationId = getState().lastLocation || LOCATIONS[0].id;
  let floorId = FLOORS[0].id;

  const select = el("select", {
    class: "select",
    style: { width: "100%", marginBottom: "12px" },
    onchange: (e) => { locationId = e.target.value; render(); },
  });
  for (const l of LOCATIONS) {
    const opt = el("option", { value: l.id, text: l.name });
    if (l.id === locationId) opt.selected = true;
    select.appendChild(opt);
  }
  wrap.appendChild(select);

  const tabs = el("div", { class: "floor-switcher", role: "tablist", "aria-label": "Floor", style: { marginBottom: "12px" } });
  for (const f of FLOORS) {
    tabs.appendChild(el("button", {
      type: "button",
      role: "tab",
      "data-floor": f.id,
      "aria-pressed": f.id === floorId ? "true" : "false",
      onclick: () => { floorId = f.id; render(); },
      text: f.name,
    }));
  }
  wrap.appendChild(tabs);

  const imgWrap = el("div", {
    style: {
      borderRadius: "12px",
      overflow: "hidden",
      background: "var(--c-bg-soft, #f3f4f6)",
      aspectRatio: "1448 / 1086",
    },
  });
  const img = el("img", {
    style: { width: "100%", height: "100%", display: "block", objectFit: "contain" },
    alt: "Floor plan",
    draggable: "false",
  });
  imgWrap.appendChild(img);
  wrap.appendChild(imgWrap);

  function render() {
    [...tabs.querySelectorAll("button")].forEach((b) => {
      b.setAttribute("aria-pressed", b.dataset.floor === floorId ? "true" : "false");
    });
    const floor = FLOORS.find((f) => f.id === floorId);
    img.src = floor.image;
    img.alt = `${LOCATIONS.find((l) => l.id === locationId)?.name || ""} — ${floor.name}`;
  }
  render();

  return wrap;
}
