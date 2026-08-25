
import express from "express";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

// Import the consolidated API routes from api/index.ts
import apiApp from "./api/index";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Healthcheck endpoints for Cloud Run ingress probes
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

// Mount the API app under the root (since apiApp routes already have /api/ prefix)
app.use(apiApp);

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
