import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BrandStoryPage } from "./BrandStoryPage";
import "./styles.css";

const root = document.getElementById("root");

if (!root) throw new Error("Missing #root mount element");

const normalizedPath = window.location.pathname.replace(/\/index\.html$/, "").replace(/\/+$/, "");
const isBrandStoryRoute = normalizedPath === "/about";

createRoot(root).render(isBrandStoryRoute ? <BrandStoryPage /> : <App />);
