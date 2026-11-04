require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
fs.mkdirSync(dataDir, { recursive: true });
const db = new Database(path.join(dataDir, "nexora.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY, title TEXT NOT NULL, messages TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);
// CORS diperlukan karena Preview SPCK dan backend Render berjalan pada origin berbeda.
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.options("*", cors());
app.use(express.json({ limit: "1mb" }));
app.use("/api/", rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "public")));

const SYSTEM_PROMPT = `Kamu adalah NEXORA AI, asisten AI yang cerdas, ramah, hangat, jujur, kreatif, dan komunikatif.
Jawab terutama dalam bahasa yang digunakan pengguna. Pahami konteks percakapan sebelumnya.
Jelaskan dengan runtut dan praktis. Jika tidak tahu atau tidak yakin, katakan dengan jujur.
Jangan mengaku punya kemampuan, akses, atau pengalaman yang sebenarnya tidak dimiliki.
Jaga privasi dan keselamatan pengguna.`;

app.get("/api/config", (_req, res) => {
  res.json({ configured: Boolean(process.env.OPENAI_API_KEY), model: process.env.OPENAI_MODEL || "gpt-4.1-mini" });
});

app.get("/api/chats", (_req, res) => {
  const rows = db.prepare("SELECT id, title, updated_at FROM conversations ORDER BY updated_at DESC").all();
  res.json(rows);
});

app.get("/api/chats/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM conversations WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Percakapan tidak ditemukan." });
  res.json({ ...row, messages: JSON.parse(row.messages) });
});

app.delete("/api/chats/:id", (req, res) => {
  db.prepare("DELETE FROM conversations WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: "API key belum dipasang. Isi OPENAI_API_KEY di file .env pada server." });
    }
    const { messages, chatId } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Pesan belum diisi." });
    }
    const safeMessages = messages.slice(-24).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 12000)
    }));
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...safeMessages],
        temperature: 0.7
      })
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || "Permintaan AI gagal." });
    }
    const answer = data.choices?.[0]?.message?.content || "Maaf, belum ada jawaban.";
    const id = chatId || require("crypto").randomUUID();
    const allMessages = [...safeMessages, { role: "assistant", content: answer }];
    const title = (safeMessages.find(m => m.role === "user")?.content || "Percakapan baru").slice(0, 48);
    db.prepare(`INSERT INTO conversations (id, title, messages, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET messages=excluded.messages, updated_at=excluded.updated_at`)
      .run(id, title, JSON.stringify(allMessages), new Date().toISOString());
    res.json({ answer, chatId: id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server bermasalah. Periksa log server." });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log(`NEXORA AI berjalan pada port ${PORT}`));
