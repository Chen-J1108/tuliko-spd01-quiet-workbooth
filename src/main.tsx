import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BrandStoryPage } from "./BrandStoryPage";
import "./styles.css";

const normalizedPath = window.location.pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
const isBrandStoryRoute = normalizedPath === "/about";
const isProductHomeRoute = normalizedPath === "";
const isVideoFirstEntry = isProductHomeRoute
  && (!window.location.hash || window.location.hash === "#hero");

// Every fresh home-page load begins with the cinematic prelude. Older shared
// links may still end in #hero, so remove that hash only during document boot;
// later in-page TOP and logo links keep using #hero for the product overview.
if (isVideoFirstEntry) {
  if ("scrollRestoration" in window.history) {
    window.history.scrollRestoration = "manual";
  }
  if (window.location.hash === "#hero") {
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
  }
  const resetVideoEntry = () => window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  resetVideoEntry();
  window.addEventListener("pageshow", resetVideoEntry, { once: true });
}

const root = document.getElementById("root");

if (!root) throw new Error("Missing #root mount element");

createRoot(root).render(isBrandStoryRoute ? <BrandStoryPage /> : <App />);
