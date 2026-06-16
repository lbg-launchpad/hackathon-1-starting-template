// Profile / Preferences. On non-mobile (browser), also shows a QR code
// that links to this app so the user can open / install it on their phone.

import { el, toast } from "../components/ui.js";
import { renderQRCode } from "../components/qrcode.js";
import {
  getState,
  currentUser,
  update,
} from "../store.js";
import { AMENITIES, AMENITY_KEYS } from "../data.js";

function isMobileUA() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export function ProfileView() {
  const root = el("div", { class: "view view--profile" });
  const me = currentUser();
  if (!me) return el("div", { class: "empty", text: "Loading…" });

  // User card
  root.appendChild(el("section", { class: "card" }, [
    el("div", { style: { display: "flex", gap: "14px", alignItems: "center" } }, [
      el("span", { class: "avatar", style: { width: "56px", height: "56px", fontSize: "18px" }, text: me.initials }),
      el("div", null, [
        el("div", { style: { fontWeight: 700, fontSize: "17px" }, text: me.name }),
        el("div", { style: { fontSize: "13px", color: "var(--c-fg-muted)" }, text: `${me.role} • ${me.team}` }),
        el("div", { style: { fontSize: "12px", color: "var(--c-fg-muted)" }, text: me.email }),
      ]),
    ]),
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

  // Notification preferences
  root.appendChild(el("section", { class: "card", style: { marginTop: "12px" } }, [
    el("div", { class: "card__title" }, [el("h2", { text: "Notifications" })]),
    toggleRow("Email confirmation / cancellation", "emailNotifications"),
    toggleRow("Push notifications (web + mobile)",  "pushNotifications"),
    toggleRow("Auto check-in via geolocation",       "autoCheckIn"),
  ]));

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
