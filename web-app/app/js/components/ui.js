// Tiny UI primitives: el() builder, modal, toast.

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === "dataset") {
      Object.assign(node.dataset, v);
    } else if (k === "style" && typeof v === "object") {
      Object.assign(node.style, v);
    } else if (v === true) {
      node.setAttribute(k, "");
    } else {
      node.setAttribute(k, v);
    }
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null || c === false) continue;
    if (typeof c === "string" || typeof c === "number") node.appendChild(document.createTextNode(String(c)));
    else node.appendChild(c);
  }
  return node;
}

export function clear(node) { while (node && node.firstChild) node.removeChild(node.firstChild); }

// --- Modal -------------------------------------------------------------------
export function openModal({ title, body, footer, onClose }) {
  const root = document.getElementById("modalRoot");
  clear(root);
  const close = () => { clear(root); onClose && onClose(); };
  const backdrop = el("div", {
    class: "modal-backdrop",
    onclick: (e) => { if (e.target === backdrop) close(); },
  }, [
    el("div", { class: "modal", role: "dialog", "aria-modal": "true" }, [
      el("div", { class: "modal__head" }, [
        el("div", { class: "modal__title", text: title || "" }),
        el("button", { class: "modal__close", "aria-label": "Close", onclick: close }, [
          el("span", { html: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>` }),
        ]),
      ]),
      el("div", { class: "modal__body" }, body),
      footer ? el("div", { class: "modal__foot" }, footer) : null,
    ]),
  ]);
  document.addEventListener("keydown", function onKey(e) {
    if (e.key === "Escape") { document.removeEventListener("keydown", onKey); close(); }
  });
  root.appendChild(backdrop);
  return close;
}

// --- Toast -------------------------------------------------------------------
export function toast(message, variant = "default", ms = 2400) {
  const host = document.getElementById("toastRoot");
  if (!host.classList.contains("toast-host")) host.classList.add("toast-host");
  const t = el("div", { class: `toast toast--${variant}`, text: message });
  host.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transition = "opacity 220ms ease";
    setTimeout(() => t.remove(), 240);
  }, ms);
}

// --- Tiny SVG icon -----------------------------------------------------------
export function icon(name, size = 14) {
  const paths = {
    "volume-low":  `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>`,
    moon:          `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`,
    sun:           `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>`,
    monitor:       `<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>`,
    monitors:      `<rect x="2" y="3" width="14" height="10" rx="1.5"/><rect x="8" y="9" width="14" height="10" rx="1.5"/>`,
    stand:         `<path d="M4 9h16M6 9v7M18 9v7M9 16h6"/>`,
    window:        `<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/>`,
    shield:        `<path d="M12 2 4 6v6c0 5 4 8 8 10 4-2 8-5 8-10V6l-8-4z"/>`,
    chair:         `<path d="M5 9V6a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3M5 9h14l-1 5H6L5 9zm2 5v5m10-5v5"/>`,
    coffee:        `<path d="M6 8h12v6a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8zM18 9h2a2 2 0 0 1 0 4h-2M6 2v3M10 2v3M14 2v3"/>`,
    accessible:    `<circle cx="12" cy="4" r="2"/><path d="M19 13l-3-1-2 1-1 4-3-4-2 5M6 10s2-2 5-2"/>`,
    "eye-off":     `<path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22M9.88 9.88a3 3 0 1 0 4.24 4.24"/>`,
    flame:         `<path d="M12 2s5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4-1 0-3-1-3-3 3 0 6-3 6-3z"/>`,
    snow:          `<path d="M12 2v20M4.93 4.93l14.14 14.14M2 12h20M4.93 19.07l14.14-14.14"/>`,
  };
  const d = paths[name] || "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
}
