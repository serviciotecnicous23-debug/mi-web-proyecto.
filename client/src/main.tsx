import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

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
