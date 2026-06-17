// Profile / Preferences. On non-mobile (browser), also shows a QR code
// that links to this app so the user can open / install it on their phone.

import { el, toast } from "../components/ui.js";
import { renderQRCode } from "../components/qrcode.js";
import {
  getState,
  currentUser,
  update,
} from "../store.js";
import { AMENITIES, AMENITY_KEYS, LOCATIONS } from "../data.js";

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const WEEKDAY_KEYS = WEEKDAYS.map((d) => d.toLowerCase());
const WORK_CYCLE = ["office", "remote", "off"];
const WORK_META = {
  office: { label: "Office", color: "var(--c-brand)",         fg: "white" },
  remote: { label: "Remote", color: "color-mix(in oklab, var(--c-brand) 18%, var(--c-bg-elev))", fg: "var(--c-fg)" },
  off:    { label: "Off",    color: "transparent",             fg: "var(--c-fg-muted)" },
};
const PRONOUN_OPTIONS = [
  "",
  "she/her",
  "he/him",
  "they/them",
  "she/they",
  "he/they",
  "Prefer not to say",
];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

function isMobileUA() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function ProfileView() {
  const root = el("div", { class: "view view--profile" });
  const me = currentUser();
  if (!me) return el("div", { class: "empty", text: "Loading…" });

  // Profile card (editable; buffered draft, flushed on Update)
  root.appendChild(buildProfileCard(me));

  // From Workday (read-only HR record)
  root.appendChild(el("section", { class: "card", style: { marginTop: "12px" } }, [
    el("div", { class: "card__title" }, [el("h2", { text: "From Workday" })]),
    el("p", { style: { fontSize: "12px", color: "var(--c-fg-muted)", margin: "0 0 8px" }, text: "Read-only — sourced from HR." }),
    kvRow("Role", me.role),
    kvRow("Team", me.team),
    kvRow("Email", me.email),
    kvRow("Office", me.location),
    me.manager ? kvRow("Line manager", me.manager) : null,
  ]));

  // Switch user (handy for hackathon demo)
  root.appendChild(el("section", { class: "card", style: { marginTop: "12px" } }, [
    el("div", { class: "card__title" }, [el("h2", { text: "Sign in as (demo)" })]),
    el("select", {
      class: "select",
      onchange: (e) => {
        update((s) => {
          s.currentUserId = e.target.value;
          const u = s.users.find((u) => u.id === e.target.value);
          if (u) { s.bookingDraft.locationId = u.location; s.lastLocation = u.location; }
        });
        toast("Switched user — refreshing…", "default");
        setTimeout(() => location.reload(), 500);
      },
    }, getState().users.slice(0, 30).map((u) => {
      const opt = el("option", { value: u.id, text: `${u.name} — ${u.team}` });
      if (u.id === me.id) opt.selected = true;
      return opt;
    })),
  ]));

  // My desk needs
  root.appendChild(el("section", { class: "card", style: { marginTop: "12px" } }, [
    el("div", { class: "card__title" }, [
      el("h2", { text: "My desk needs" }),
      el("span", { class: "badge", text: `${getState().preferences.myDeskNeeds.length} selected` }),
    ]),
    el("p", { style: { fontSize: "13px", color: "var(--c-fg-muted)", margin: "0 0 10px" }, text: "Pre-applied to every booking. Updates anyone, anytime — no need to disclose anything." }),
    el("div", { style: { display: "flex", flexWrap: "wrap", gap: "6px" } },
      AMENITY_KEYS.map((k) => {
        const active = getState().preferences.myDeskNeeds.includes(k);
        return el("button", {
          type: "button",
          class: "chip",
          "aria-pressed": active ? "true" : "false",
          onclick: (e) => {
            update((s) => {
              const arr = s.preferences.myDeskNeeds;
              const i = arr.indexOf(k);
              if (i >= 0) arr.splice(i, 1); else arr.push(k);
            });
            e.currentTarget.setAttribute("aria-pressed", getState().preferences.myDeskNeeds.includes(k) ? "true" : "false");
          },
          text: AMENITIES[k].label,
        });
      }),
    ),
  ]));

  // Notifications
  root.appendChild(el("section", { class: "card", style: { marginTop: "12px" } }, [
    el("div", { class: "card__title" }, [el("h2", { text: "Notifications" })]),
    toggleRow("Email confirmation / cancellation", "emailNotifications"),
    toggleRow("Push notifications (web + mobile)",  "pushNotifications"),
    toggleRow("Auto check-in via geolocation",       "autoCheckIn"),
  ]));

  // Advanced settings — PA toggle gated on Workday data
  root.appendChild(buildAdvancedCard(me));

  // QR code — browser only
  if (!isMobileUA()) {
    const installUrl = location.href.split("#")[0];
    root.appendChild(el("section", { class: "card qr-card", style: { marginTop: "12px" } }, [
      el("h2", { style: { fontSize: "16px" }, text: "Open on your phone" }),
      el("div", { class: "qr-card__img", html: renderQRCode(installUrl, 200) }),
      el("div", { class: "qr-card__hint" }, [
        "Scan with your phone camera to open Spaces",
        el("span", { style: { fontWeight: 700, color: "var(--c-brand)" }, text: "@LBG" }),
        " — then tap ",
        el("strong", { text: "Add to Home Screen" }),
        " to install it as a mobile app.",
      ]),
      el("button", { class: "btn btn--ghost btn--sm", onclick: () => { navigator.clipboard?.writeText(installUrl); toast("Link copied", "success"); } }, "Copy link"),
    ]));
  }

  // Sign out (mock)
  root.appendChild(el("div", { style: { display: "flex", justifyContent: "center", marginTop: "16px" } }, [
    el("button", { class: "btn btn--ghost", onclick: () => toast("Mock sign-out — SSO would take over here", "default") }, "Sign out"),
  ]));

  return root;
}

// --- Profile card (buffered) -------------------------------------------------

function buildProfileCard(me) {
  // Local draft buffer — only flushed to the store on Update.
  const prefs = getState().preferences;
  const draft = {
    avatarDataUrl: prefs.avatarDataUrl || "",
    preferredName: prefs.displayName || "",
    pronouns: prefs.pronouns || "",
    phone: prefs.phone || "",
    anchorDays: Array.isArray(me.anchorDays) ? [...me.anchorDays] : [],
    workingPattern: { ...me.workingPattern },
    preferredLocation: prefs.preferredLocation || "",
  };

  const card = el("section", { class: "card" });
  card.appendChild(el("div", { class: "card__title" }, [el("h2", { text: "Profile" })]));
  card.appendChild(el("p", {
    style: { fontSize: "12px", color: "var(--c-fg-muted)", margin: "0 0 10px" },
    text: "Tap Update to save your changes.",
  }));

  // Avatar block — preview + source picker
  const previewBox = el("span", {
    class: "avatar",
    style: { width: "72px", height: "72px", fontSize: "22px", flex: "0 0 72px" },
  });
  paintPreview();

  function paintPreview() {
    if (draft.avatarDataUrl) {
      previewBox.textContent = "";
      previewBox.style.backgroundImage = `url(${draft.avatarDataUrl})`;
      previewBox.style.backgroundSize = "cover";
      previewBox.style.backgroundPosition = "center";
      previewBox.style.color = "transparent";
    } else {
      previewBox.textContent = me.initials || "??";
      previewBox.style.backgroundImage = "";
      previewBox.style.backgroundSize = "";
      previewBox.style.backgroundPosition = "";
      previewBox.style.color = "";
    }
  }

  const fileInput = el("input", {
    type: "file",
    accept: "image/*",
    style: { display: "none" },
    onchange: (e) => {
      const file = e.target.files && e.target.files[0];
      e.target.value = "";
      if (!file) return;
      if (!file.type.startsWith("image/")) { toast("Please choose an image file", "danger"); return; }
      if (file.size > MAX_AVATAR_BYTES) { toast("Image too large — max 2 MB", "danger"); return; }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    },
  });

  // Single container we re-render whenever the avatar changes.
  const photoBtns = el("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } });
  paintPhotoBtns();

  function setAvatar(url) {
    draft.avatarDataUrl = url;
    paintPreview();
    paintPhotoBtns();
  }

  function paintPhotoBtns() {
    photoBtns.replaceChildren(
      el("button", {
        type: "button",
        class: "btn btn--sm",
        onclick: () => fileInput.click(),
      }, draft.avatarDataUrl ? "Change photo" : "Upload photo"),
      draft.avatarDataUrl ? el("button", {
        type: "button",
        class: "btn btn--sm btn--ghost",
        onclick: () => setAvatar(""),
      }, "Remove") : document.createComment("no remove"),
    );
  }

  card.appendChild(el("div", {
    style: { display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap", marginBottom: "6px" },
  }, [
    previewBox,
    el("div", { style: { flex: "1 1 200px", minWidth: 0 } }, [
      el("div", { style: { fontSize: "12px", color: "var(--c-fg-muted)", marginBottom: "6px" }, text: "Profile photo" }),
      photoBtns,
      el("div", { style: { fontSize: "11px", color: "var(--c-fg-muted)", marginTop: "6px" }, text: "Square image, up to 2 MB." }),
      fileInput,
    ]),
  ]));

  // Preferred name
  card.appendChild(fieldBlock("Preferred name",
    el("input", {
      class: "input",
      type: "text",
      value: draft.preferredName,
      placeholder: me.name,
      oninput: (e) => { draft.preferredName = e.target.value; },
    }),
    "Leave blank to use your Workday name.",
  ));

  // Pronouns dropdown
  const pronounSelect = el("select", { class: "select", onchange: (e) => { draft.pronouns = e.target.value; } });
  for (const opt of PRONOUN_OPTIONS) {
    const o = el("option", { value: opt, text: opt || "—" });
    if (draft.pronouns === opt) o.selected = true;
    pronounSelect.appendChild(o);
  }
  card.appendChild(fieldBlock("Pronouns", pronounSelect));

  // Phone
  card.appendChild(fieldBlock("Phone",
    el("input", {
      class: "input",
      type: "tel",
      value: draft.phone,
      placeholder: "Optional",
      oninput: (e) => { draft.phone = e.target.value; },
    }),
  ));

  // Anchor days (chips)
  card.appendChild(fieldBlock(
    "Anchor days",
    anchorDaysEditor(draft),
    "Days you're typically in-office.",
  ));

  // Working pattern (single-row cycling chips)
  card.appendChild(fieldBlock(
    "Working pattern",
    workingPatternEditor(draft),
    "Tap a day to cycle Office → Remote → Off.",
  ));

  // Preferred office
  card.appendChild(fieldBlock(
    "Preferred office",
    preferredOfficeEditor(draft),
    "Where the booking page opens by default.",
  ));

  // Update button (sticky-feeling)
  const updateBtn = el("button", {
    type: "button",
    class: "btn btn--block",
    style: { marginTop: "16px" },
    onclick: () => {
      const trimmedName = draft.preferredName.trim();
      // Normalize anchor days order
      const normalizedAnchors = WEEKDAYS.filter((d) => draft.anchorDays.includes(d));
      update((s) => {
        Object.assign(s.preferences, {
          avatarDataUrl:   draft.avatarDataUrl,
          displayName:     trimmedName,
          pronouns:        draft.pronouns,
          phone:           draft.phone.trim(),
          anchorDays:      normalizedAnchors,
          workingPattern:  { ...draft.workingPattern },
          preferredLocation: draft.preferredLocation,
        });
      });
      toast("Profile updated", "success");
    },
  }, "Update profile");
  card.appendChild(updateBtn);

  return card;
}

// --- Helpers ----------------------------------------------------------------

function toggleRow(label, key) {
  return el("label", {
    style: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderTop: "1px solid var(--c-border)" },
  }, [
    el("span", { text: label, style: { fontSize: "14px" } }),
    el("input", {
      type: "checkbox",
      checked: getState().preferences[key],
      onchange: (e) => update((s) => { s.preferences[key] = e.target.checked; }),
      style: { width: "20px", height: "20px", accentColor: "var(--c-brand)" },
    }),
  ]);
}

function kvRow(k, v) {
  return el("div", {
    style: { display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "1px solid var(--c-border)", fontSize: "13px" },
  }, [
    el("span", { text: k, style: { color: "var(--c-fg-muted)" } }),
    el("span", { text: v || "—", style: { fontWeight: 600 } }),
  ]);
}

function fieldBlock(label, control, hint) {
  return el("div", { class: "field", style: { marginTop: "12px" } }, [
    el("label", { class: "field__label", text: label }),
    control,
    hint ? el("div", { style: { fontSize: "11px", color: "var(--c-fg-muted)", marginTop: "4px" }, text: hint }) : null,
  ]);
}

function anchorDaysEditor(draft) {
  const wrap = el("div", { style: { display: "flex", gap: "6px", flexWrap: "wrap" } });
  for (const day of WEEKDAYS) {
    const btn = el("button", {
      type: "button",
      class: "chip",
      "aria-pressed": draft.anchorDays.includes(day) ? "true" : "false",
      text: day.slice(0, 3),
      onclick: () => {
        const i = draft.anchorDays.indexOf(day);
        if (i >= 0) draft.anchorDays.splice(i, 1);
        else draft.anchorDays.push(day);
        btn.setAttribute("aria-pressed", draft.anchorDays.includes(day) ? "true" : "false");
      },
    });
    wrap.appendChild(btn);
  }
  return wrap;
}

function workingPatternEditor(draft) {
  const row = el("div", {
    style: { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" },
  });
  for (let i = 0; i < WEEKDAYS.length; i++) {
    const key = WEEKDAY_KEYS[i];
    const initial = draft.workingPattern[key] || "office";
    if (!draft.workingPattern[key]) draft.workingPattern[key] = "office";
    const chip = el("button", {
      type: "button",
      style: chipStyleFor(initial),
      onclick: () => {
        const cur = draft.workingPattern[key] || "office";
        const next = WORK_CYCLE[(WORK_CYCLE.indexOf(cur) + 1) % WORK_CYCLE.length];
        draft.workingPattern[key] = next;
        Object.assign(chip.style, chipStyleFor(next));
        chip.querySelector("[data-status]").textContent = WORK_META[next].label;
      },
    }, [
      el("div", { style: { fontSize: "12px", fontWeight: 700, letterSpacing: "0.02em" }, text: WEEKDAYS[i].slice(0, 3).toUpperCase() }),
      el("div", { "data-status": "1", style: { fontSize: "10px", marginTop: "2px", opacity: 0.85 }, text: WORK_META[initial].label }),
    ]);
    row.appendChild(chip);
  }
  return row;
}

function chipStyleFor(state) {
  const meta = WORK_META[state];
  const isOff = state === "off";
  return {
    background: meta.color,
    color: meta.fg,
    border: state === "remote"
      ? "1px solid color-mix(in oklab, var(--c-brand) 40%, var(--c-border))"
      : isOff ? "1px dashed var(--c-border)" : "1px solid transparent",
    borderRadius: "var(--r-sm)",
    padding: "8px 4px",
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
    textAlign: "center",
    lineHeight: "1.1",
  };
}

function preferredOfficeEditor(draft) {
  const select = el("select", {
    class: "select",
    onchange: (e) => { draft.preferredLocation = e.target.value || ""; },
  });
  select.appendChild(el("option", { value: "", text: "Use my Workday office" }));
  for (const loc of LOCATIONS) {
    const opt = el("option", { value: loc.id, text: loc.name });
    if (draft.preferredLocation === loc.id) opt.selected = true;
    select.appendChild(opt);
  }
  return select;
}

// --- Advanced settings card --------------------------------------------------

function buildAdvancedCard(me) {
  const card = el("section", { class: "card", style: { marginTop: "12px" } });
  card.appendChild(el("div", { class: "card__title" }, [el("h2", { text: "Advanced settings" })]));
  card.appendChild(el("p", {
    style: { fontSize: "12px", color: "var(--c-fg-muted)", margin: "0 0 8px" },
    text: "For executive assistants and other special roles.",
  }));

  const enabled = !!me.workdayIsPA;
  const checked = enabled && !!getState().preferences.isPA;

  card.appendChild(el("label", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 0",
      borderTop: "1px solid var(--c-border)",
      opacity: enabled ? 1 : 0.55,
      cursor: enabled ? "pointer" : "not-allowed",
    },
  }, [
    el("div", null, [
      el("div", { style: { fontSize: "14px", fontWeight: 600 }, text: "I'm a PA — book up to 1 year ahead" }),
      el("div", {
        style: { fontSize: "11px", color: "var(--c-fg-muted)", marginTop: "2px" },
        text: enabled
          ? "Your Workday record lists you as an executive assistant."
          : "Locked — Workday hasn't flagged you as a PA. Contact HR if this is wrong.",
      }),
    ]),
    el("input", {
      type: "checkbox",
      checked,
      disabled: !enabled,
      onchange: (e) => {
        update((s) => { s.preferences.isPA = !!e.target.checked && enabled; });
      },
      style: { width: "20px", height: "20px", accentColor: "var(--c-brand)" },
    }),
  ]));

  return card;
}

