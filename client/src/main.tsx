import * as Sentry from "@sentry/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// ========== SENTRY ERROR MONITORING ==========
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance monitoring: 20% of transactions in production
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
    // Session replay: 10% normal, 100% on error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
  console.log("[sentry] Client monitoring initialized");
}

// Register PWA service worker for offline support and fast loading
if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then(
      (registration) => {
        console.log("SW registered:", registration.scope);
        // Check for updates periodically
        setInterval(() => registration.update(), 60 * 60 * 1000); // Every hour
      },
      (error) => {
        console.log("SW registration failed:", error);
      }
    );
  });
}

createRoot(document.getElementById("root")!).render(<App />);
