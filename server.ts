import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import path from "path";
import apiRoutes from "./backend/routes";

const app = express();
app.use(
  cors({
    origin: [
      "https://civicintel-ai.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

// Mount backend API routes
app.use("/api", apiRoutes);

async function startServer() {
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
    console.log(`CivicIntel AI OS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
