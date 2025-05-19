import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Point to your built Vite app (dist folder)
const clientPath = path.join(__dirname, "..", "dist");
app.use(express.static(clientPath));

// Fallback to index.html for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running: http://localhost:${PORT}`);
});