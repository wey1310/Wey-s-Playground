
import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// Process safety handlers to prevent container crashes on transient errors
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught Exception:", err);
});
process.on("SIGTERM", () => {
  console.log("[Server] SIGTERM received. Graceful exit initiated.");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("[Server] SIGINT received. Graceful exit initiated.");
  process.exit(0);
});

// Import the consolidated API routes from api/index.ts
import apiApp from "./api/index";

const app = express();

app.use(express.json({ limit: "10mb" }));

// Robust Healthcheck endpoints for Cloud Run ingress and startup/liveness probes
const handleHealthCheck = (req: express.Request, res: express.Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
};

app.get("/health", handleHealthCheck);
app.get("/healthz", handleHealthCheck);
app.get("/ready", handleHealthCheck);
app.get("/live", handleHealthCheck);
app.get("/api/health", handleHealthCheck);
app.head("/health", (req, res) => res.status(200).end());
app.head("/healthz", (req, res) => res.status(200).end());

// Mount the API app under the root (since apiApp routes already have /api/ prefix)
app.use(apiApp);

function resolveDistDirectory(): string {
  const possiblePaths = [
    path.join(__dirname, "index.html"),
    path.join(__dirname, "dist", "index.html"),
    path.join(process.cwd(), "dist", "index.html"),
    path.join(__dirname, "..", "dist", "index.html"),
    path.join(process.cwd(), "index.html"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return path.dirname(p);
    }
  }

  return path.join(process.cwd(), "dist");
}

async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    // Development mode with Vite middleware
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // In dev sandbox, port 3000 is strictly required behind the local proxy
    const DEV_PORT = 3000;
    app.listen(DEV_PORT, "0.0.0.0", () => {
      console.log(`[Dev Server] running on http://0.0.0.0:${DEV_PORT}`);
    });
  } else {
    // Production mode
    const distPath = resolveDistDirectory();
    console.log(`[Production Server] Serving static files from: ${distPath}`);

    app.use(express.static(distPath, { index: false }));

    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, (err) => {
          if (err && !res.headersSent) {
            res.status(200).send("<!doctype html><html><head><title>App</title></head><body><div id='root'></div></body></html>");
          }
        });
      } else {
        res.status(200).send("<!doctype html><html><head><title>App</title></head><body><div id='root'></div></body></html>");
      }
    });

    // Cloud Run assigns PORT (typically 8080), while other container setups may probe 3000.
    // Bind to the designated Cloud Run port and maintain fallback listeners to guarantee probe success.
    const primaryPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

    const primaryServer = app.listen(primaryPort, "0.0.0.0", () => {
      console.log(`[Production Server] Primary listener active on 0.0.0.0:${primaryPort}`);
    });
    primaryServer.on("error", (err: any) => {
      console.error(`[Production Server] Primary listener error on port ${primaryPort}:`, err.message);
    });

    // Bind secondary port 3000 if different from primary, ensuring internal container bridges work seamlessly
    if (primaryPort !== 3000) {
      try {
        const secondaryServer = app.listen(3000, "0.0.0.0", () => {
          console.log(`[Production Server] Secondary listener active on 0.0.0.0:3000`);
        });
        secondaryServer.on("error", (err: any) => {
          // Non-fatal if 3000 is occupied or restricted
          console.log(`[Production Server] Port 3000 listener note:`, err.message);
        });
      } catch (e: any) {
        console.log(`[Production Server] Could not bind port 3000:`, e?.message);
      }
    }

    // Bind secondary port 8080 if different from primary, ensuring standard Cloud Run probes succeed
    if (primaryPort !== 8080) {
      try {
        const altServer = app.listen(8080, "0.0.0.0", () => {
          console.log(`[Production Server] Cloud Run fallback listener active on 0.0.0.0:8080`);
        });
        altServer.on("error", (err: any) => {
          console.log(`[Production Server] Port 8080 listener note:`, err.message);
        });
      } catch (e: any) {
        console.log(`[Production Server] Could not bind port 8080:`, e?.message);
      }
    }
  }
}

startServer();

