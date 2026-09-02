import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BrandStoryPage } from "./BrandStoryPage";
import "./styles.css";

const normalizedPath = window.location.pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
const isBrandStoryRoute = normalizedPath === "/about";

// The unadorned product URL is the cinematic entry. Browser scroll
// restoration must not skip past it on a first visit or reload. In-page TOP
// links deliberately use #hero, which remains the separate product overview.
if (!isBrandStoryRoute && !window.location.hash) {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
  const resetVideoEntry = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  resetVideoEntry();
  window.addEventListener("pageshow", resetVideoEntry, { once: true });
}

const root = document.getElementById("root");

if (!root) throw new Error("Missing #root mount element");

createRoot(root).render(isBrandStoryRoute ? <BrandStoryPage /> : <App />);
