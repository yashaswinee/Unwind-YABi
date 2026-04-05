import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import { getInsights, getSignalsOnly } from "./services/insights.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const FILE_PATH = path.join(DATA_DIR, "chat-log.json");
const PASSIVE_FILE_PATH = path.join(DATA_DIR, "passive-writing.json");
const SCHEDULED_MEETS_PATH = path.join(DATA_DIR, "scheduled-meets.json");

const app = express();
app.use(express.json())
app.use(cors());
app.use(express.json());

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, JSON.stringify({}, null, 2));
}

function readData() {
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf-8").trim();
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error("JSON Parse Error:", err);
    return {};
  }
}

function writeData(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.status(200).send("Backend is working");
});

app.post("/messages", (req, res) => {
  try {
    const { session_id, text, role, title } = req.body;

    if (!session_id || !text) {
      return res.status(400).json({
        error: "session_id and text are required",
      });
    }

    const data = readData();

    if (!data[session_id]) {
    const now = new Date();
    const day = now.getDate();
    const month = now.toLocaleString('default', { month: 'short' });

    data[session_id] = {
      title: title || `${day} ${month}`,
      created_at: now.toISOString(),
      messages: [],
    };
    }

    const newMessage = {
      id: crypto.randomUUID(),
      role: role || "user",
      text,
      timestamp: new Date().toISOString(),
    };

    data[session_id].messages.push(newMessage);

    // Use first user message as session title (context) instead of date
    const userMessages = data[session_id].messages.filter((m) => m.role === "user");
    if (userMessages.length === 1) {
      const trimmed = text.trim();
      const maxLen = 56;
      const providedTitle = typeof title === "string" ? title.trim() : "";

      if (providedTitle) {
        data[session_id].title = providedTitle;
      } else {
        data[session_id].title =
          trimmed.length > maxLen ? trimmed.slice(0, maxLen).trim() + "…" : trimmed || data[session_id].title;
      }
    }

    writeData(data);

    res.status(201).json({
      success: true,
      message: newMessage,
    });

  } catch (err) {
    console.error("POST ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.get("/messages", (req, res) => {
  const data = readData();
  res.json(data);
});


app.get("/messages/:session_id", (req, res) => {
  const { session_id } = req.params;
  const data = readData();

  if (!data[session_id]) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(data[session_id]);
});


app.delete("/messages/:session_id", (req, res) => {
  const { session_id } = req.params;
  const data = readData();

  if (!data[session_id]) {
    return res.status(404).json({ error: "Session not found" });
  }

  delete data[session_id];
  writeData(data);

  res.json({ success: true });
});


// -----------------------------------------------------------------------------------------------------
// Passive writing 
// -----------------------------------------------------------------------------------------------------

function readPassiveData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(PASSIVE_FILE_PATH)) {
      fs.writeFileSync(PASSIVE_FILE_PATH, JSON.stringify({}, null, 2));
      return {};
    }

    const raw = fs.readFileSync(PASSIVE_FILE_PATH, "utf-8").trim();
    if (!raw) return {};

    return JSON.parse(raw);
  } catch (err) {
    console.error("Passive JSON Parse Error:", err);
    return {};
  }
}

function writePassiveData(data) {
  fs.writeFileSync(PASSIVE_FILE_PATH, JSON.stringify(data, null, 2));
}

app.post("/passive-writing", (req, res) => {
  try {
    const { session_id, content } = req.body;

    if (!session_id || !content) {
      return res.status(400).json({
        error: "session_id and content are required",
      });
    }

    const data = readPassiveData();

    // If session doesn't exist → create it
    if (!data[session_id]) {
      data[session_id] = {
        created_at: new Date().toISOString(),
      };
    }

    // Overwrite content every time
    data[session_id].content = content;
    data[session_id].updated_at = new Date().toISOString();

    writePassiveData(data);

    res.status(200).json({
      success: true,
      session: data[session_id],
    });

  } catch (err) {
    console.error("PASSIVE SAVE ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/passive-writing", (req, res) => {
  try {
    const data = readPassiveData();
    res.json(data);
  } catch (err) {
    console.error("GET /passive-writing error:", err);
    res.status(500).json({});
  }
});

app.get("/passive-writing/:session_id", (req, res) => {
  const { session_id } = req.params;

  const data = readPassiveData();

  if (!data[session_id]) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(data[session_id]);
});

// -----------------------------------------------------------------------------------------------------
// Insights & signals (NLP from active + passive writing)
// -----------------------------------------------------------------------------------------------------

app.get("/api/insights", (req, res) => {
  try {
    const forceRefresh = req.query.refresh === "true";
    const payload = getInsights(forceRefresh);
    res.json(payload);
  } catch (err) {
    console.error("GET /api/insights error:", err);
    res.status(500).json({ error: "Failed to compute insights" });
  }
});

app.get("/api/signals", (req, res) => {
  try {
    const signals = getSignalsOnly();
    res.json({ signals });
  } catch (err) {
    console.error("GET /api/signals error:", err);
    res.status(500).json({ error: "Failed to get signals", signals: [] });
  }
});

// -----------------------------------------------------------------------------------------------------
// Scheduled meets (Care Plan – from Counsellors "Schedule Meet")
// -----------------------------------------------------------------------------------------------------

function readScheduledMeets() {
  try {
    if (!fs.existsSync(SCHEDULED_MEETS_PATH)) return [];
    const raw = fs.readFileSync(SCHEDULED_MEETS_PATH, "utf-8").trim();
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("readScheduledMeets error:", err);
    return [];
  }
}

function writeScheduledMeets(list) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SCHEDULED_MEETS_PATH, JSON.stringify(list, null, 2));
}

app.get("/api/scheduled-meets", (req, res) => {
  try {
    const meets = readScheduledMeets();
    res.json({ meets });
  } catch (err) {
    console.error("GET /api/scheduled-meets error:", err);
    res.status(500).json({ error: "Failed to get scheduled meets", meets: [] });
  }
});

app.post("/api/scheduled-meets", (req, res) => {
  try {
    const { counsellorName, datetime } = req.body;
    if (!counsellorName || !datetime) {
      return res.status(400).json({ error: "counsellorName and datetime are required" });
    }
    const meets = readScheduledMeets();
    const newMeet = {
      id: crypto.randomUUID(),
      counsellorName: String(counsellorName),
      datetime: String(datetime),
      createdAt: new Date().toISOString(),
    };
    meets.push(newMeet);
    meets.sort((a, b) => (a.datetime || "").localeCompare(b.datetime || ""));
    writeScheduledMeets(meets);
    res.status(201).json({ success: true, meet: newMeet });
  } catch (err) {
    console.error("POST /api/scheduled-meets error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});