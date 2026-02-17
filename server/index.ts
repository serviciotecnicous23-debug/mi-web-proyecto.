import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { ensureDatabaseSchema } from "./ensure-schema";
import { createServer } from "http";
import path from "path";
import compression from "compression";
import helmet from "helmet";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// ========== TRUST PROXY ==========
// Must be set BEFORE any middleware that depends on it (session, rate-limit)
// Required for Render, Codespaces, and any reverse proxy environment
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// ========== COMPRESSION (gzip) ==========
// Reduces response sizes by ~70%, much faster page loads
app.use(compression());

// ========== SECURITY HEADERS (helmet) ==========
const videoFrameSources = [
  "'self'",
  // YouTube
  "https://www.youtube.com",
  "https://youtube.com",
  "https://*.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://*.youtube-nocookie.com",
  "https://*.ytimg.com",
  "https://*.googlevideo.com",
  // Facebook
  "https://www.facebook.com",
  "https://web.facebook.com",
  "https://*.facebook.com",
  "https://*.fbcdn.net",
  "https://*.facebook.net",
  // TikTok
  "https://www.tiktok.com",
  "https://*.tiktok.com",
  "https://*.tiktokcdn.com",
  // Other platforms
  "https://player.vimeo.com",
  "https://zoom.us",
  "https://*.zoom.us",
  "https://meet.google.com",
  "https://teams.microsoft.com",
];
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.youtube.com", "https://*.facebook.com", "https://*.facebook.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      frameSrc: videoFrameSources,
      childSrc: videoFrameSources,
      workerSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

// Servir archivos estáticos de uploads (avatares, regiones, biblioteca, etc.)
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  maxAge: "7d", // Cache uploaded files for 7 days
  etag: true,
}));

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure all database tables and columns exist before starting
  await ensureDatabaseSchema();

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
