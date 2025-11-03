import express from "express";
import db from "../db.js";

const router = express.Router();

db.prepare(`
  CREATE TABLE IF NOT EXISTS expo_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT UNIQUE,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run();

router.post("/", (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Missing token" });

  db.prepare(`INSERT OR IGNORE INTO expo_tokens (token) VALUES (?)`).run(token);
  res.json({ success: true });
});

export default router;