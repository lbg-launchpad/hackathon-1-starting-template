// Interactive floor plan with selectable dots, pan/zoom, arrow nav.
//
// The image lives inside a CSS-transformed `.floorplan__inner` (so pan/zoom
// uses GPU-friendly transforms). Desk dots are rendered as an SVG overlay
// at *stage* level — outside the scaled container — so they keep a constant
// screen size regardless of zoom. Dot positions are recomputed on every
// transform change.

import { el, icon } from "./ui.js";
import { AMENITIES, FLOORS } from "../data.js";
import {
  getState,
  bookingsOnDesk,
  deskOccupantOn,
  currentUser,
  update,
} from "../store.js";

const NATIVE_W = 1448;
const NATIVE_H = 1086;
const SVG_NS = "http://www.w3.org/2000/svg";

export function FloorPlan({ onSelect, filterAmenities, bookingDateProvider, selectedDeskIdProvider }) {
  const root = el("div", { class: "floorplan" });

  const stage = el("div", { class: "floorplan__stage" });
  const inner = el("div", { class: "floorplan__inner" });
  const img = el("img", { class: "floorplan__img", alt: "Floor plan", draggable: "false" });
  inner.appendChild(img);
  stage.appendChild(inner);

  // SVG overlay for desk dots — sits above the image, fills the stage,
  // positioned in screen space so dots don't get tiny at fit-zoom.
  const overlay = document.createElementNS(SVG_NS, "svg");
  overlay.setAttribute("class", "floorplan__overlay");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.pointerEvents = "none"; // each dot re-enables this
  stage.appendChild(overlay);

  root.appendChild(stage);

  // Floor switcher
  const switcher = el("div", { class: "floor-switcher", role: "tablist", "aria-label": "Floor" });
  for (const f of FLOORS) {
    switcher.appendChild(el("button", {
      type: "button",
      role: "tab",
      "aria-pressed": "false",
      "data-floor": f.id,
      onclick: () => setFloor(f.id),
      text: f.name,
    }));
  }

  // Pan/zoom + arrow controls
  const controls = el("div", { class: "floorplan__controls" });
  const mkCtrl = (label, svgPath, on) => el("button", {
    class: "floorplan__ctrl", "aria-label": label, type: "button", onclick: on,
    html: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>`,
  });
  controls.append(
    mkCtrl("Zoom in",     `<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/>`, () => zoomBy(1.25)),
    mkCtrl("Zoom out",    `<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/>`,         () => zoomBy(0.8)),
    mkCtrl("Fit to screen",`<path d="M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6"/>`,                         () => fitToScreen()),
    mkCtrl("Pan left",    `<path d="M15 18l-6-6 6-6"/>`,  () => panBy(-120, 0)),
    mkCtrl("Pan right",   `<path d="M9 18l6-6-6-6"/>`,    () => panBy(120, 0)),
    mkCtrl("Pan up",      `<path d="M18 15l-6-6-6 6"/>`,  () => panBy(0, -120)),
    mkCtrl("Pan down",    `<path d="M6 9l6 6 6-6"/>`,     () => panBy(0, 120)),
  );
  stage.appendChild(controls);

  // Legend
  const legend = el("div", { class: "floorplan__legend" });
  const legendItem = (color, label) => el("span", { class: "legend-item" }, [
    el("span", { class: "legend-dot", style: { background: color } }),
    el("span", { text: label }),
  ]);
  legend.append(
    legendItem("var(--desk-available)", "Available"),
    legendItem("var(--desk-booked)",    "Booked"),
    legendItem("var(--desk-team)",      "Teammate"),
    legendItem("var(--desk-mine)",      "Yours"),
  );
  stage.appendChild(legend);

  // Internal state
  let floorId = (getState().bookingDraft.floorId) || "ground";
  let scale = 1, tx = 0, ty = 0;
  let dragging = false, lastX = 0, lastY = 0, panMoved = false;
  let imageW = NATIVE_W, imageH = NATIVE_H;
  let imageLoaded = false;

  function setFloor(id) {
    floorId = id;
    update((s) => { s.bookingDraft.floorId = id; });
    [...switcher.querySelectorAll("button")].forEach((b) => b.setAttribute("aria-pressed", b.dataset.floor === id ? "true" : "false"));
    const f = FLOORS.find((x) => x.id === id);
    imageLoaded = false;
    img.onload = () => {
      imageW = img.naturalWidth || NATIVE_W;
      imageH = img.naturalHeight || NATIVE_H;
      inner.style.width = imageW + "px";
      inner.style.height = imageH + "px";
      img.style.width = imageW + "px";
      img.style.height = imageH + "px";
      imageLoaded = true;
      fitToScreen();
      renderDots();
    };
    img.onerror = () => {
      console.warn("Floor plan image failed to load:", f.image);
      // Still render dots over a blank stage so booking works.
      imageW = NATIVE_W; imageH = NATIVE_H;
      inner.style.width = imageW + "px";
      inner.style.height = imageH + "px";
      imageLoaded = true;
      fitToScreen();
      renderDots();
    };
    img.src = f.image;
  }

  function applyTransform() {
    inner.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    positionDots();
  }

  function fitToScreen() {
    const stageW = stage.clientWidth || 600;
    const stageH = stage.clientHeight || 400;
    const fit = Math.min(stageW / imageW, stageH / imageH);
    scale = fit;
    tx = (stageW - imageW * scale) / 2;
    ty = (stageH - imageH * scale) / 2;
    applyTransform();
  }

  function zoomBy(factor) {
    const cx = stage.clientWidth / 2;
    const cy = stage.clientHeight / 2;
    const wx = (cx - tx) / scale;
    const wy = (cy - ty) / scale;
    scale = Math.max(0.2, Math.min(4, scale * factor));
    tx = cx - wx * scale;
    ty = cy - wy * scale;
    applyTransform();
  }

  function panBy(dx, dy) { tx += dx; ty += dy; applyTransform(); }

  // Drag pan (only when not pressing a dot or a control button)
  stage.addEventListener("pointerdown", (e) => {
    if (!e.target.closest) return;
    if (e.target.closest("[data-desk]")) return;
    if (e.target.closest(".floorplan__ctrl, .floor-switcher, button")) return;
    dragging = true; panMoved = false;
    lastX = e.clientX; lastY = e.clientY;
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
  });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    if (Math.abs(dx) + Math.abs(dy) > 3) panMoved = true;
    tx += dx; ty += dy;
    lastX = e.clientX; lastY = e.clientY;
    applyTransform();
  });
  stage.addEventListener("pointerup", () => { dragging = false; });
  stage.addEventListener("pointercancel", () => { dragging = false; });

  // Wheel zoom + pan
  stage.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.ctrlKey || e.shiftKey || Math.abs(e.deltaY) > 40) {
      // zoom
      const rect = stage.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const wx = (cx - tx) / scale;
      const wy = (cy - ty) / scale;
      scale = Math.max(0.2, Math.min(4, scale * factor));
      tx = cx - wx * scale;
      ty = cy - wy * scale;
    } else {
      // pan
      tx -= e.deltaX; ty -= e.deltaY;
    }
    applyTransform();
  }, { passive: false });

  // --- Dot rendering (SVG overlay, screen-space) -----------------------------
  // Map: desk.id -> { g, circle, label }
  const dotMap = new Map();

  function renderDots() {
    // Clear existing
    while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
    dotMap.clear();

    const s = getState();
    const loc = s.bookingDraft.locationId;
    const date = bookingDateProvider ? bookingDateProvider() : s.bookingDraft.date;
    const me = currentUser();
    const selectedId = selectedDeskIdProvider ? selectedDeskIdProvider() : s.bookingDraft.selectedDeskId;
    const teamMap = s.bookingDraft.teamDeskMap || {};
    const myTeamSet = me ? new Set(s.users.filter((u) => u.team === me.team && u.id !== me.id).map((u) => u.id)) : new Set();

    let visibleCount = 0;
    for (const desk of s.desks) {
      if (desk.locationId !== loc || desk.floorId !== floorId) continue;
      if (filterAmenities && filterAmenities.length) {
        if (!filterAmenities.every((a) => desk.amenities.includes(a))) continue;
      }
      const occupant = deskOccupantOn(desk.id, date);
      const cls = ["floorplan__dot"];
      if (occupant && me && occupant.id === me.id) cls.push("is-mine");
      else if (occupant && myTeamSet.has(occupant.id)) cls.push("is-team");
      else if (occupant) cls.push("is-booked");
      if (selectedId === desk.id) cls.push("is-selected");
      if (Object.values(teamMap).includes(desk.id)) cls.push("is-team");

      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", cls.join(" "));
      g.setAttribute("data-desk", desk.id);
      g.style.cursor = "pointer";
      g.style.pointerEvents = "auto";

      const halo = document.createElementNS(SVG_NS, "circle");
      halo.setAttribute("r", 16);
      halo.setAttribute("class", "floorplan__dot-halo");
      g.appendChild(halo);

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("r", 11);
      g.appendChild(circle);

      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "central");
      label.setAttribute("class", "floorplan__dot-label");
      label.textContent = occupant ? occupant.initials : desk.number.replace(/^[G1]/, "");
      g.appendChild(label);

      g.addEventListener("click", (e) => {
        e.stopPropagation();
        if (panMoved) { panMoved = false; return; }
        onSelect && onSelect(desk);
      });
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect && onSelect(desk); }
      });
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `Desk ${desk.number}${occupant ? ` — booked by ${occupant.name}` : " — available"}`);

      overlay.appendChild(g);
      dotMap.set(desk.id, { g, desk });
      visibleCount++;
    }
    positionDots();
    // Empty-state hint if no desks match
    let hint = stage.querySelector(".floorplan__no-desks");
    if (!visibleCount) {
      if (!hint) {
        hint = el("div", { class: "floorplan__no-desks", text: "No desks match the current filters." });
        stage.appendChild(hint);
      }
    } else if (hint) {
      hint.remove();
    }
  }

  function positionDots() {
    for (const { g, desk } of dotMap.values()) {
      const x = desk.x * imageW * scale + tx;
      const y = desk.y * imageH * scale + ty;
      g.setAttribute("transform", `translate(${x}, ${y})`);
    }
  }

  // Refresh on resize so fit-to-screen layout adapts.
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => {
    if (imageLoaded) { fitToScreen(); }
  }) : null;
  if (ro) ro.observe(stage);

  // Public hooks
  root.refresh = renderDots;
  root.setFloor = setFloor;

  // Kick off after layout so stage has dimensions.
  setTimeout(() => setFloor(floorId), 0);

  // Compose wrapper: switcher row + floor plan
  const wrap = el("div");
  wrap.appendChild(el("div", {
    style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px", flexWrap: "wrap" },
  }, [
    switcher,
    el("div", { style: { fontSize: "12px", color: "var(--c-fg-muted)" }, text: "Tap a numbered dot to see desk details" }),
  ]));
  wrap.appendChild(root);
  wrap.refresh = renderDots;
  wrap.setFloor = setFloor;
  return wrap;
}

// --- Desk popup card (rendered next to / below the floor plan) -------------
export function DeskCard({ desk, date, actions }) {
  if (!desk) return el("div", { class: "empty" }, [
    el("h3", { text: "No desk selected" }),
    el("p", { text: "Tap a numbered dot on the floor plan above to see details." }),
  ]);

  const occupant = deskOccupantOn(desk.id, date);
  const booking = bookingsOnDesk(desk.id, date)[0];

  const amenityRow = el("div", { class: "desk-pop__amenities" },
    desk.amenities.map((a) => el("span", { class: "desk-pop__amenity" }, [
      el("span", { html: icon(AMENITIES[a]?.icon || "shield", 12) }),
      el("span", { text: AMENITIES[a]?.label || a }),
    ])),
  );

  const occupantBlock = occupant ? el("div", { class: "desk-pop__occupant" }, [
    el("span", { class: "avatar", text: occupant.initials }),
    el("div", { style: { flex: 1 } }, [
      el("div", { class: "desk-pop__name", text: occupant.name }),
      el("div", { class: "desk-pop__role", text: `${occupant.role} • ${occupant.team}` }),
    ]),
    booking ? el("span", { class: "badge", text: booking.label || "Booked" }) : null,
  ]) : null;

  return el("div", { class: "desk-pop", "data-desk": desk.id }, [
    el("div", { class: "desk-pop__head" }, [
      el("div", null, [
        el("div", { class: "desk-pop__num", text: `Desk ${desk.number}` }),
        el("div", { class: "desk-pop__zone", text: `${desk.zone} • ${capitalise(desk.floorId)} floor` }),
      ]),
      occupant
        ? el("span", { class: "badge badge--danger", text: "Occupied" })
        : el("span", { class: "badge", text: "Available" }),
    ]),
    amenityRow,
    occupantBlock,
    actions ? el("div", { class: "desk-pop__actions", style: { display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" } }, actions) : null,
  ]);
}

function capitalise(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
