import { build } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const isProduction = process.env.NODE_ENV === "production";

async function buildApp() {
  try {
    console.log("Building application...");
    
    // Import the config dynamically
    const config = (await import(path.resolve(root, "vite.config.ts"))).default;
    
    // Build with Vite
    await build({
      ...config,
      mode: isProduction ? "production" : "development",
    });

    console.log("Build complete!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildApp();
