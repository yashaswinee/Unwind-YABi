import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const FILE_PATH = path.join(DATA_DIR, "chat-log.json");
const PASSIVE_FILE_PATH = path.join(DATA_DIR, "passive-writing.json");

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
  res.status(200).send("Backend is working 🚀");
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
      data[session_id] = {
        title: title || text.slice(0, 30),
        created_at: new Date().toISOString(),
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


app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
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

    // Create session if not exists
    if (!data[session_id]) {
      data[session_id] = {
        created_at: new Date().toISOString(),
        versions: [],
      };
    }

    const newVersion = {
      version_id: data[session_id].versions.length + 1,
      content,
      timestamp: new Date().toISOString(),
    };

    data[session_id].versions.push(newVersion);

    writePassiveData(data);

    res.status(201).json({
      success: true,
      version: newVersion,
    });

  } catch (err) {
    console.error("PASSIVE SAVE ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
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