import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs-extra";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// test route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

async function setupServer() {
  const distPath = path.resolve(process.cwd(), "client/dist");
  console.log(`Checking for static files at: ${distPath}`);

  if (await fs.pathExists(distPath)) {
    console.log("Static files found, enabling frontend serving.");
    app.use(express.static(distPath));

    app.get("(.*)", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.warn("WARNING: client/dist directory NOT found. Only API routes will be available.");
  }

  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is LIVE on port ${PORT}`);
    console.log(`Health check available at: /api/health`);
  });
}

setupServer().catch(err => {
  console.error("Critical server startup error:", err);
  process.exit(1);
});
