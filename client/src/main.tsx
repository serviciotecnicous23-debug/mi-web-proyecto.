import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Unregister any stale service workers that may be caching bad responses
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
