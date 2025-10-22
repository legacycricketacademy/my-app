import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import session from "express-session";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const ORIGIN = process.env.ORIGIN || process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({ origin: ORIGIN, credentials: true }));
app.set("trust proxy", 1);
const COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN || undefined;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "sid";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me";
app.use(session({
  name: COOKIE_NAME,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly:true, secure:true, sameSite:"none", domain: COOKIE_DOMAIN, maxAge: 1000*60*60*24*7 }
}));

app.use(express.json());
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