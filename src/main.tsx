import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installGlobalErrorReporting } from "./utils/errorReporter";

// Uncaught errors and unhandled rejections get reported to the backend crash
// log (production only — the reporter no-ops in dev).
installGlobalErrorReporting();

createRoot(document.getElementById("root")!).render(<App />);

// Register the service worker up front so offline caching works for everyone,
// not just users who enable push (which was previously the only registration
// path). Production only — in dev it would fight Vite's module server.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration can fail in unsupported webviews; the app works without it.
    });
  });
}
