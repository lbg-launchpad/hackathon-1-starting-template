// Minimal hash router. Each route is a function returning a DOM element.

const routes = new Map();
let currentTeardown = null;

export function route(path, factory) { routes.set(path, factory); }

export function navigate() {
  const hash = (location.hash || "#/").replace(/^#/, "");
  const path = hash === "" ? "/" : hash;
  const factory = routes.get(path) || routes.get("/");
  const main = document.getElementById("appMain");
  while (main.firstChild) main.removeChild(main.firstChild);
  if (typeof currentTeardown === "function") { try { currentTeardown(); } catch (_) {} }
  currentTeardown = null;
  const node = factory();
  if (node) main.appendChild(node);
  highlightNav(path);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function highlightNav(path) {
  const items = document.querySelectorAll(".bottom-nav .nav-item");
  items.forEach((a) => {
    if (a.dataset.route === path) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

export function startRouter() {
  window.addEventListener("hashchange", navigate);
  navigate();
}
