// Book view: pick location/floor/date/time-slot, see the floor plan, choose a desk.
// Includes "Book for my team" multi-desk flow.

import { el, toast, openModal } from "../components/ui.js";
import { FloorPlan, DeskCard } from "../components/floorplan.js";
import {
  getState,
  currentUser,
  update,
  TIME_SLOTS,
  fmtTime,
  fmtDate,
  todayISO,
  deskById,
  deskIsFreeFor,
  anyDeskFreeOn,
  userOnWaitlist,
  genBookingId,
  genWaitlistId,
} from "../store.js";
import { AMENITIES, AMENITY_KEYS, LOCATIONS, FLOORS } from "../data.js";
import { sendBookingConfirmation } from "../email.js";

export function BookView() {
  const root = el("div", { class: "view view--book" });
  const me = currentUser();
  if (!me) return el("div", { class: "empty", text: "Loading…" });

  // If the user has a preferred office set and the booking draft is still on
  // a different location (e.g. left over from last session or Workday default),
  // switch to the preferred office on entry.
  if (me.preferredLocation && getState().bookingDraft.locationId !== me.preferredLocation) {
    update((s) => {
      s.bookingDraft.locationId = me.preferredLocation;
      s.bookingDraft.selectedDeskId = null;
    });
  }
  const draft = getState().bookingDraft;

  // Mutable refs used by closures defined later in this function. Declared up
  // top to avoid Temporal Dead Zone errors when bookForTeamToggle() — invoked
  // during initial render — writes to teamPanelRef.
  let teamPanelRef;

  // --- Controls card ---------------------------------------------------------
  const controls = el("section", { class: "card" });

  // Location + Floor + Date
  controls.appendChild(field("Location", locationSelect()));
  controls.appendChild(field("Date", dateInput()));

  // Time slot
  controls.appendChild(el("div", { class: "field" }, [
    el("label", { class: "field__label", text: "Time" }),
    timeSlotPicker(),
  ]));

  // Amenity filter chips (collapsible)
  controls.appendChild(amenityFilter());

  // "Book for my team" toggle
  controls.appendChild(bookForTeamToggle());

  root.appendChild(controls);

  // --- "Best match for you" suggestion banner -------------------------------
  const suggestHost = el("div");
  root.appendChild(suggestHost);
  renderSuggestion();

  // --- Floor plan + selected desk card --------------------------------------
  const planWrap = el("section", { class: "card", style: { marginTop: "12px", padding: "14px" } });
  const plan = FloorPlan({
    onSelect: (desk) => selectDesk(desk),
    filterAmenities: getCurrentFilters(),
    bookingDateProvider: () => getState().bookingDraft.date,
    selectedDeskIdProvider: () => getState().bookingDraft.selectedDeskId,
  });
  planWrap.appendChild(plan);
  root.appendChild(planWrap);

  function suggestBestDesk() {
    const prefs = getState().preferences.myDeskNeeds || [];
    if (!prefs.length) return null;
    const d = getState().bookingDraft;
    const slot = activeSlot();
    const candidates = getState().desks.filter(
      (desk) => desk.locationId === d.locationId && desk.floorId === d.floorId,
    );
    let best = null;
    for (const desk of candidates) {
      if (!deskIsFreeFor({ deskId: desk.id, date: d.date, startMin: slot.startMin, endMin: slot.endMin })) continue;
      const score = prefs.reduce((n, key) => (desk.amenities.includes(key) ? n + 1 : n), 0);
      if (score === 0) continue;
      if (!best || score > best.score) best = { desk, score };
    }
    return best;
  }

  function renderSuggestion() {
    suggestHost.replaceChildren();
    const match = suggestBestDesk();
    const selectedId = getState().bookingDraft.selectedDeskId;
    if (!match || match.desk.id === selectedId) return;
    const prefs = getState().preferences.myDeskNeeds || [];
    suggestHost.appendChild(el("button", {
      type: "button",
      class: "card",
      style: {
        marginTop: "12px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        cursor: "pointer",
        border: "1px solid color-mix(in oklab, var(--c-brand) 35%, var(--c-border))",
        background: "color-mix(in oklab, var(--c-brand) 6%, var(--c-bg))",
        textAlign: "left",
        width: "100%",
      },
      onclick: () => selectDesk(match.desk),
    }, [
      el("span", {
        style: {
          width: "34px", height: "34px", flex: "0 0 34px",
          borderRadius: "999px",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "color-mix(in oklab, var(--c-brand) 22%, var(--c-bg))",
          color: "var(--c-brand)",
          fontWeight: 700,
        },
        text: "★",
      }),
      el("div", { style: { flex: "1 1 auto", minWidth: 0 } }, [
        el("div", { style: { fontSize: "11px", color: "var(--c-fg-muted)", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" }, text: "Best match for you" }),
        el("div", { style: { fontSize: "14px", fontWeight: 600 }, text: `Desk ${match.desk.number} · ${match.desk.zone}` }),
        el("div", { style: { fontSize: "12px", color: "var(--c-fg-muted)" }, text: `Matches ${match.score} of ${prefs.length} preference${prefs.length === 1 ? "" : "s"}` }),
      ]),
      el("span", { style: { fontSize: "13px", color: "var(--c-brand)", fontWeight: 600 }, text: "View →" }),
    ]));
  }

  const waitlistHost = el("div");
  root.appendChild(waitlistHost);

  const deskHost = el("section", { class: "card", style: { marginTop: "12px" } });
  root.appendChild(deskHost);

  function refreshFloorPlan() {
    plan.refresh && plan.refresh();
    renderSuggestion();
    renderWaitlistBanner();
  }

  function renderWaitlistBanner() {
    waitlistHost.replaceChildren();
    const d = getState().bookingDraft;
    const slot = activeSlot();
    const free = anyDeskFreeOn({
      locationId: d.locationId,
      floorId: d.floorId,
      date: d.date,
      startMin: slot.startMin,
      endMin: slot.endMin,
      amenityFilters: getCurrentFilters(),
    });
    if (free) return;

    const me = currentUser();
    const alreadyWaiting = userOnWaitlist({
      userId: me.id,
      locationId: d.locationId,
      floorId: d.floorId,
      date: d.date,
    });

    const card = el("section", {
      class: "card",
      style: {
        marginTop: "12px",
        padding: "14px",
        border: "1px solid color-mix(in oklab, var(--c-warning, var(--c-brand)) 35%, var(--c-border))",
        background: "color-mix(in oklab, var(--c-warning, var(--c-brand)) 6%, var(--c-bg))",
      },
    });
    card.appendChild(el("div", { style: { fontWeight: 600, fontSize: "14px", marginBottom: "4px" }, text: "No desks available for this day" }));
    card.appendChild(el("div", {
      style: { fontSize: "12px", color: "var(--c-fg-muted)", marginBottom: "10px" },
      text: alreadyWaiting
        ? `You're on the waitlist for ${fmtDate(d.date)}. We'll email you the moment a desk opens up.`
        : `Add yourself to the waitlist for ${fmtDate(d.date)} — you'll get an email as soon as a desk frees up.`,
    }));
    if (!alreadyWaiting) {
      card.appendChild(el("button", {
        class: "btn",
        type: "button",
        onclick: () => addSelfToWaitlist(),
      }, "Add me to the waitlist"));
    }
    waitlistHost.appendChild(card);
  }

  function addSelfToWaitlist() {
    const d = getState().bookingDraft;
    const slot = activeSlot();
    const me = currentUser();
    const entry = {
      id: genWaitlistId(),
      userId: me.id,
      locationId: d.locationId,
      floorId: d.floorId,
      date: d.date,
      startMin: slot.startMin,
      endMin: slot.endMin,
      createdAt: new Date().toISOString(),
      notified: false,
    };
    update((s) => { s.waitlist.push(entry); });
    toast("You're on the waitlist — we'll email when a desk opens", "success");
    renderWaitlistBanner();
  }

  function renderSelectedDesk() {
    const sel = getState().bookingDraft.selectedDeskId;
    const desk = deskById(sel);
    deskHost.replaceChildren(DeskCard({
      desk,
      date: getState().bookingDraft.date,
      actions: desk ? deskActions(desk) : null,
    }));
    renderSuggestion();
  }
  renderSelectedDesk();
  renderWaitlistBanner();

  // helpers shared in closures -----------------------------------------------
  function selectDesk(desk) {
    update((s) => { s.bookingDraft.selectedDeskId = desk.id; });
    refreshFloorPlan();
    renderSelectedDesk();
    // scroll desk card into view on mobile for fast feedback
    requestAnimationFrame(() => deskHost.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  function getCurrentFilters() { return getState().bookingDraft.amenityFilters; }

  function deskActions(desk) {
    const draft = getState().bookingDraft;
    const slot = activeSlot();
    const free = deskIsFreeFor({ deskId: desk.id, date: draft.date, startMin: slot.startMin, endMin: slot.endMin });
    if (draft.forTeam) {
      return [
        el("button", { class: "btn btn--ghost btn--sm", onclick: () => assignDeskToTeammate(desk) }, "Assign to teammate"),
        el("button", { class: "btn btn--sm", onclick: () => bookTeam() }, "Confirm team booking"),
      ];
    }
    return [
      el("button", { class: "btn", disabled: !free, onclick: () => bookSelectedDesk(desk) }, free ? "Book this desk" : "Already booked"),
    ];
  }

  function activeSlot() {
    const d = getState().bookingDraft;
    if (d.slotKey === "custom") {
      return { startMin: d.customStart, endMin: d.customEnd, label: `${fmtTime(d.customStart)}–${fmtTime(d.customEnd)}` };
    }
    const s = TIME_SLOTS[d.slotKey];
    return { startMin: s.startMin, endMin: s.endMin, label: s.label };
  }

  function bookSelectedDesk(desk) {
    const slot = activeSlot();
    const d = getState().bookingDraft;
    const booking = {
      id: genBookingId(),
      userId: currentUser().id,
      deskId: desk.id,
      date: d.date,
      startMin: slot.startMin,
      endMin: slot.endMin,
      label: slot.label,
      checkedIn: false,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    update((s) => { s.bookings.push(booking); s.bookingDraft.selectedDeskId = null; });
    sendBookingConfirmation(booking);
    refreshFloorPlan();
    renderSelectedDesk();
  }

  function assignDeskToTeammate(desk) {
    const draft = getState().bookingDraft;
    if (!draft.teammates.length) {
      toast("Add teammates first using the toggle above", "default");
      return;
    }
    // Pick the next unassigned teammate
    const next = draft.teammates.find((id) => !draft.teamDeskMap[id]);
    if (!next) {
      toast("Every teammate already has a desk", "default");
      return;
    }
    // Make sure the desk is free
    const slot = activeSlot();
    if (!deskIsFreeFor({ deskId: desk.id, date: draft.date, startMin: slot.startMin, endMin: slot.endMin })) {
      toast("That desk is already booked for this time", "danger");
      return;
    }
    update((s) => { s.bookingDraft.teamDeskMap[next] = desk.id; });
    refreshFloorPlan();
    renderTeamPanel();
  }

  function bookTeam() {
    const draft = getState().bookingDraft;
    const slot = activeSlot();
    const map = draft.teamDeskMap;
    const ids = Object.keys(map);
    if (!ids.length) {
      toast("Assign at least one teammate to a desk first", "danger");
      return;
    }
    const newBookings = ids.map((uid) => ({
      id: genBookingId(),
      userId: uid,
      deskId: map[uid],
      date: draft.date,
      startMin: slot.startMin,
      endMin: slot.endMin,
      label: slot.label + " (team)",
      checkedIn: false,
      status: "confirmed",
      createdAt: new Date().toISOString(),
      teamFor: currentUser().id,
    }));
    update((s) => {
      s.bookings.push(...newBookings);
      s.bookingDraft.teamDeskMap = {};
      s.bookingDraft.teammates = [];
      s.bookingDraft.forTeam = false;
      s.bookingDraft.selectedDeskId = null;
    });
    // Send confirmation emails (each teammate)
    newBookings.forEach((b, i) => setTimeout(() => sendBookingConfirmation(b), i === 0 ? 0 : 0));
    toast(`${newBookings.length} desks booked for your team`, "success");
    refreshFloorPlan();
    renderSelectedDesk();
    renderTeamPanel();
  }

  // --- Inputs ----------------------------------------------------------------
  function locationSelect() {
    const select = el("select", { class: "select", onchange: (e) => {
      update((s) => {
        s.bookingDraft.locationId = e.target.value;
        s.lastLocation = e.target.value;
        s.bookingDraft.selectedDeskId = null;
      });
      refreshFloorPlan();
      renderSelectedDesk();
    } });
    for (const l of LOCATIONS) {
      const opt = el("option", { value: l.id, text: l.name });
      if (getState().bookingDraft.locationId === l.id) opt.selected = true;
      select.appendChild(opt);
    }
    return select;
  }

  function dateInput() {
    const min = todayISO();
    const maxD = new Date();
    // PAs can book up to a year ahead; everyone else is limited to 4 weeks.
    maxD.setDate(maxD.getDate() + (currentUser()?.isPA ? 365 : 28));
    const max = maxD.toISOString().slice(0, 10);
    return el("input", {
      class: "input",
      type: "date",
      min, max,
      value: getState().bookingDraft.date,
      onchange: (e) => {
        update((s) => { s.bookingDraft.date = e.target.value; s.bookingDraft.selectedDeskId = null; });
        refreshFloorPlan();
        renderSelectedDesk();
      },
    });
  }

  function timeSlotPicker() {
    const grid = el("div", { class: "slot-grid" });
    for (const key of ["day", "morning", "afternoon", "custom"]) {
      const t = TIME_SLOTS[key];
      const btn = el("button", {
        type: "button",
        class: "chip",
        "aria-pressed": getState().bookingDraft.slotKey === key ? "true" : "false",
        onclick: () => {
          update((s) => { s.bookingDraft.slotKey = key; });
          // toggle aria + re-render custom row
          [...grid.querySelectorAll(".chip")].forEach((c) => c.setAttribute("aria-pressed", c === btn ? "true" : "false"));
          customRow.style.display = key === "custom" ? "grid" : "none";
          renderSelectedDesk();
        },
      }, [
        el("span", { text: t.label }),
        key !== "custom" ? el("span", { style: { fontSize: "11px", opacity: 0.75 }, text: `${fmtTime(t.startMin)}–${fmtTime(t.endMin)}` }) : null,
      ]);
      grid.appendChild(btn);
    }
    const customRow = el("div", { class: "custom-time", style: { display: getState().bookingDraft.slotKey === "custom" ? "grid" : "none" } }, [
      el("input", {
        type: "time",
        class: "input",
        value: minToTimeStr(getState().bookingDraft.customStart),
        onchange: (e) => { update((s) => { s.bookingDraft.customStart = timeStrToMin(e.target.value); }); renderSelectedDesk(); },
      }),
      el("input", {
        type: "time",
        class: "input",
        value: minToTimeStr(getState().bookingDraft.customEnd),
        onchange: (e) => { update((s) => { s.bookingDraft.customEnd = timeStrToMin(e.target.value); }); renderSelectedDesk(); },
      }),
    ]);
    const wrap = el("div");
    wrap.appendChild(grid);
    wrap.appendChild(customRow);
    return wrap;
  }

  function amenityFilter() {
    const card = el("details", { class: "field", style: { background: "var(--c-bg-elev)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: "10px 12px" } });
    const summary = el("summary", { style: { cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "var(--c-fg-soft)" }, text: "Amenities filter" });
    card.appendChild(summary);
    const chips = el("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" } });
    for (const key of AMENITY_KEYS) {
      const active = getState().bookingDraft.amenityFilters.includes(key);
      const chip = el("button", {
        type: "button",
        class: "chip",
        "aria-pressed": active ? "true" : "false",
        onclick: () => {
          update((s) => {
            const list = s.bookingDraft.amenityFilters;
            const i = list.indexOf(key);
            if (i >= 0) list.splice(i, 1); else list.push(key);
          });
          chip.setAttribute("aria-pressed", getState().bookingDraft.amenityFilters.includes(key) ? "true" : "false");
          refreshFloorPlan();
        },
        text: AMENITIES[key].label,
      });
      chips.appendChild(chip);
    }
    card.appendChild(chips);
    return card;
  }

  function bookForTeamToggle() {
    const wrap = el("div", { class: "field" });
    const row = el("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" } }, [
      el("div", null, [
        el("div", { style: { fontWeight: 600, fontSize: "14px" }, text: "Book for my team" }),
        el("div", { style: { fontSize: "12px", color: "var(--c-fg-muted)" }, text: "Pick teammates and assign desks for them in one go." }),
      ]),
      el("label", { class: "switch", style: { display: "inline-flex", alignItems: "center", cursor: "pointer", gap: "8px" } }, [
        el("input", {
          type: "checkbox",
          checked: getState().bookingDraft.forTeam,
          onchange: (e) => {
            update((s) => { s.bookingDraft.forTeam = e.target.checked; if (!e.target.checked) { s.bookingDraft.teammates = []; s.bookingDraft.teamDeskMap = {}; } });
            renderTeamPanel();
          },
          "aria-label": "Toggle team booking",
          style: { width: "18px", height: "18px", accentColor: "var(--c-brand)" },
        }),
      ]),
    ]);
    wrap.appendChild(row);
    const panel = el("div", { id: "teamPanel", style: { marginTop: "10px" } });
    wrap.appendChild(panel);
    teamPanelRef = panel;
    renderTeamPanel();
    return wrap;
  }

  function renderTeamPanel() {
    if (!teamPanelRef) return;
    teamPanelRef.replaceChildren();
    const draft = getState().bookingDraft;
    if (!draft.forTeam) return;
    const me = currentUser();
    const teammates = getState().users.filter((u) => u.team === me.team && u.id !== me.id);

    const list = el("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" } });
    for (const t of teammates) {
      const active = draft.teammates.includes(t.id);
      const chip = el("button", {
        type: "button",
        class: "chip",
        "aria-pressed": active ? "true" : "false",
        onclick: () => {
          update((s) => {
            const arr = s.bookingDraft.teammates;
            const i = arr.indexOf(t.id);
            if (i >= 0) { arr.splice(i, 1); delete s.bookingDraft.teamDeskMap[t.id]; }
            else arr.push(t.id);
          });
          renderTeamPanel();
          refreshFloorPlan();
        },
      }, [
        el("span", { class: "avatar", style: { width: "20px", height: "20px", fontSize: "10px" }, text: t.initials }),
        el("span", { text: t.name.split(" ")[0] }),
      ]);
      list.appendChild(chip);
    }
    teamPanelRef.appendChild(list);

    // Show assigned mapping
    if (draft.teammates.length) {
      const head = el("div", { style: { fontSize: "12px", color: "var(--c-fg-muted)", marginBottom: "6px" }, text: `Tap a desk and use "Assign to teammate" — assigns to the next unassigned name in order.` });
      teamPanelRef.appendChild(head);
      const rows = el("div");
      for (const id of draft.teammates) {
        const user = getState().users.find((u) => u.id === id);
        const deskId = draft.teamDeskMap[id];
        const desk = deskId ? deskById(deskId) : null;
        rows.appendChild(el("div", { class: "row" }, [
          el("span", { class: "avatar", text: user?.initials }),
          el("div", { class: "row__main" }, [
            el("div", { class: "row__title", text: user?.name }),
            el("div", { class: "row__sub", text: desk ? `Desk ${desk.number} • ${desk.zone}` : "No desk assigned yet" }),
          ]),
          desk ? el("button", { class: "btn btn--ghost btn--sm", onclick: () => {
            update((s) => { delete s.bookingDraft.teamDeskMap[id]; });
            refreshFloorPlan();
            renderTeamPanel();
          } }, "Clear") : null,
        ]));
      }
      teamPanelRef.appendChild(rows);

      teamPanelRef.appendChild(el("div", { style: { display: "flex", justifyContent: "flex-end", marginTop: "10px" } }, [
        el("button", { class: "btn", onclick: bookTeam }, "Book team desks"),
      ]));
    }
  }

  return root;
}

function field(label, control) {
  return el("div", { class: "field" }, [
    el("label", { class: "field__label", text: label }),
    control,
  ]);
}

function minToTimeStr(min) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}
function timeStrToMin(s) {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}
