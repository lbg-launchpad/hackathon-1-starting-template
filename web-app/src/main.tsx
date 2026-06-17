import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { AppStoreProvider } from "./lib/app-store";
import { Toaster } from "sonner";
import "./styles.css";

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById("root")!;
ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppStoreProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors closeButton />
    </AppStoreProvider>
  </React.StrictMode>,
);
