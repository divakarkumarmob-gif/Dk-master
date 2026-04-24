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
  const possiblePaths = [
    path.resolve(process.cwd(), "client/dist"),     // Root is /
    path.resolve(process.cwd(), "../client/dist"),  // Root is /server
    path.resolve(process.cwd(), "dist"),            // dist is inside the root (e.g. copied to /server/dist)
  ];

  let activeDistPath = "";
  for (const p of possiblePaths) {
    console.log(`Checking for static files at: ${p}`);
    if (await fs.pathExists(p)) {
      activeDistPath = p;
      break;
    }
  }

  if (activeDistPath) {
    console.log(`Static files found at ${activeDistPath}, enabling frontend serving.`);
    app.use(express.static(activeDistPath));

    app.get("*", (req, res) => {
      res.sendFile(path.join(activeDistPath, "index.html"));
    });
  } else {
    console.warn("WARNING: Static files (dist) NOT found in any known locations. Only API routes will be available.");
  }

  // Railway normally provides a PORT env var. 
  // If your Railway setting is 3000 but it gives you 8080, we should follow Railway's env.
  // However, to be safe and match your Fig 4 settings, we can default to 3000 if not forced.
  const PORT = Number(process.env.PORT) || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is LIVE on port ${PORT}`);
    console.log(`Health check available at: /api/health`);
    console.log(`Public URL should point to port: ${PORT}`);
  });
}

setupServer().catch(err => {
  console.error("Critical server startup error:", err);
  process.exit(1);
});
