import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static assets with aggressive caching (Vite hashes filenames)
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",         // Cache hashed assets for 1 year
    immutable: true,      // These files never change (hashed names)
    etag: true,
  }));

  // Serve icons, manifest, SW with moderate caching
  app.use("/icons", express.static(path.join(distPath, "icons"), {
    maxAge: "7d",
    etag: true,
  }));

  // Other static files
  app.use(express.static(distPath, {
    maxAge: "1h",         // Short cache for index.html, manifest, etc.
    etag: true,
  }));

  // fall through to index.html if the file doesn't exist (SPA routing)
  app.use("/{*path}", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
