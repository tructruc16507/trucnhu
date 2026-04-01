import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_FILE = path.join(__dirname, "evaluations.json");

async function initData() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }
}

async function startServer() {
  await initData();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API: Save evaluation
  app.post("/api/evaluations", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      const evaluations = JSON.parse(data);
      const newEval = {
        ...req.body,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      evaluations.push(newEval);
      await fs.writeFile(DATA_FILE, JSON.stringify(evaluations, null, 2));
      res.json({ success: true, id: newEval.id });
    } catch (error) {
      console.error("Save error:", error);
      res.status(500).json({ error: "Failed to save evaluation" });
    }
  });

  // API: Get all evaluations
  app.get("/api/evaluations", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (error) {
      console.error("Fetch error:", error);
      res.status(500).json({ error: "Failed to fetch evaluations" });
    }
  });

  // API: Reset all evaluations
  app.delete("/api/evaluations", async (req, res) => {
    try {
      await fs.writeFile(DATA_FILE, JSON.stringify([]));
      res.json({ success: true });
    } catch (error) {
      console.error("Reset error:", error);
      res.status(500).json({ error: "Failed to reset evaluations" });
    }
  });

  // API: Delete individual evaluation
  app.delete("/api/evaluations/:id", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      let evaluations = JSON.parse(data);
      evaluations = evaluations.filter((e: any) => e.id !== req.params.id);
      await fs.writeFile(DATA_FILE, JSON.stringify(evaluations, null, 2));
      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Failed to delete evaluation" });
    }
  });

  // API: Save exported PDF
  app.post("/api/save-pdf", async (req, res) => {
    try {
      const { pdfData, fileName } = req.body;
      if (!pdfData) return res.status(400).json({ error: "No PDF data" });
      
      const base64Data = pdfData.replace(/^data:application\/pdf;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const pdfPath = path.join(__dirname, fileName || "all_evaluations.pdf");
      
      await fs.writeFile(pdfPath, buffer);
      res.json({ success: true, path: pdfPath });
    } catch (error) {
      console.error("Save PDF error:", error);
      res.status(500).json({ error: "Failed to save PDF" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
