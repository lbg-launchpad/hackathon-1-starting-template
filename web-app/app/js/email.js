// Simulates the transactional emails sent on booking / cancellation.
// In a real build these would go through SES/SendGrid via the API; here we
// build the email body and surface it via a modal preview + toast.

import { openModal, toast, el } from "./components/ui.js";
import { fmtDate, fmtTime, getState, update, userById, deskById, firstFreeDeskOn } from "./store.js";
import { LOCATIONS, FLOORS } from "./data.js";

function locName(locId) {
  return (LOCATIONS.find((l) => l.id === locId) || {}).name || locId;
}

function bookingEmailBody(booking, kind) {
  const user = userById(booking.userId);
  const desk = deskById(booking.deskId);
  const loc = locName(desk?.locationId);
  const start = fmtTime(booking.startMin);
  const end = fmtTime(booking.endMin);
  const heading = kind === "confirm" ? "Your desk is booked" : "Your booking has been cancelled";
  return `Hi ${user?.name?.split(" ")[0] || "there"},

${heading}.

Desk:     ${desk?.number} (${desk?.zone})
Floor:    ${desk?.floorId === "ground" ? "Ground" : "First"} floor
Location: ${loc}
Date:     ${fmtDate(booking.date)}
Time:     ${start} – ${end}

${kind === "confirm"
  ? "Use Wayfinder in the app to get step-by-step directions on the day.\nRemember: if you don't check in by 10:00 AM, your desk will be released."
  : "If this wasn't you, please raise a ticket with the Workplace team."}

Cheers,
Spaces@LBG`;
}

export function sendBookingConfirmation(booking) {
  const user = userById(booking.userId);
  if (!getState().preferences.emailNotifications) {
    toast(`Booking confirmed — email skipped (notifications off)`, "success");
    return;
  }
  showEmailModal({
    subject: `[Spaces@LBG] Desk booking confirmed — ${fmtDate(booking.date)}`,
    to: user?.email || "you@thebank.com",
    body: bookingEmailBody(booking, "confirm"),
    variant: "success",
    toastMessage: "Booking confirmed — confirmation email sent",
  });
}

function waitlistEmailBody(entry, desk) {
  const user = userById(entry.userId);
  const loc = locName(desk.locationId);
  const floor = (FLOORS.find((f) => f.id === desk.floorId) || {}).name || desk.floorId;
  return `Hi ${user?.name?.split(" ")[0] || "there"},

Good news — a desk is now available for ${fmtDate(entry.date)} on the floor you waitlisted.

Desk:     ${desk.number} (${desk.zone})
Floor:    ${floor}
Location: ${loc}

Open Spaces@LBG and head to the Book page to grab it before someone else does — first come, first served.

Cheers,
Spaces@LBG`;
}

export function sendWaitlistAvailableEmail(entry, desk) {
  const user = userById(entry.userId);
  if (!getState().preferences.emailNotifications) {
    toast(`A desk opened up for ${fmtDate(entry.date)} — email skipped (notifications off)`, "success");
    return;
  }
  showEmailModal({
    subject: `[Spaces@LBG] A desk has opened up for ${fmtDate(entry.date)}`,
    to: user?.email || "you@thebank.com",
    body: waitlistEmailBody(entry, desk),
    variant: "success",
    toastMessage: `Waitlist alert — desk available for ${fmtDate(entry.date)}`,
  });
}

// Called after a booking is cancelled. Finds any waitlist entry whose
// (locationId, floorId, date) now has a free desk and notifies the user.
export function processWaitlistForBooking(cancelledBooking) {
  const desk = deskById(cancelledBooking.deskId);
  if (!desk) return;
  const matches = (getState().waitlist || []).filter(
    (w) =>
      !w.notified &&
      w.locationId === desk.locationId &&
      w.floorId === desk.floorId &&
      w.date === cancelledBooking.date,
  );
  for (const entry of matches) {
    const free = firstFreeDeskOn({
      locationId: entry.locationId,
      floorId: entry.floorId,
      date: entry.date,
      startMin: entry.startMin,
      endMin: entry.endMin,
    });
    if (!free) continue;
    update((s) => {
      const w = s.waitlist.find((x) => x.id === entry.id);
      if (w) { w.notified = true; w.notifiedAt = new Date().toISOString(); }
    });
    sendWaitlistAvailableEmail(entry, free);
  }
}

export function sendCancellationEmail(booking) {
  const user = userById(booking.userId);
  if (!getState().preferences.emailNotifications) {
    toast(`Booking cancelled — email skipped (notifications off)`, "default");
    return;
  }
  showEmailModal({
    subject: `[Spaces@LBG] Desk booking cancelled — ${fmtDate(booking.date)}`,
    to: user?.email || "you@thebank.com",
    body: bookingEmailBody(booking, "cancel"),
    variant: "danger",
    toastMessage: "Booking cancelled — cancellation email sent",
  });
}

function showEmailModal({ subject, to, body, variant, toastMessage }) {
  openModal({
    title: variant === "success" ? "Confirmation email sent" : "Cancellation email sent",
    body: [
      el("p", { text: "A simulated email has been delivered to:", style: { margin: "0 0 8px", fontSize: "13px", color: "var(--c-fg-muted)" } }),
      el("p", { text: to, style: { margin: "0 0 14px", fontSize: "14px", fontWeight: "600" } }),
      el("div", { class: "email-preview" }, [
        el("div", { class: "email-preview__head", text: `Subject: ${subject}` }),
        el("pre", { class: "email-preview__body", text: body, style: { margin: 0, fontFamily: "inherit" } }),
      ]),
    ],
    footer: [
      el("button", { class: "btn", onclick: () => { document.getElementById("modalRoot").firstChild?.remove(); } }, "OK"),
    ],
  });
  toast(toastMessage, variant);
}
