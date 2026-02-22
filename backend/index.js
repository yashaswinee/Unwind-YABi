
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

import express from "express";

import cors from "cors";
import { Console } from "console";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "data");
const FILE_PATH = path.join(DATA_DIR, "chat-log.json");

const app = express();
app.use(express.json())
app.use(cors());

app.get("/", (req, res) => {
  res.status(200).send("Backend is working");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readData() {
  if (!fs.existsSync(FILE_PATH)) return [];
  const raw = fs.readFileSync(FILE_PATH, "utf-8").trim();
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
}


app.post("/messages", (req, res) => {
  const { session_id, user_text } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: "session_id required" });
  }

  const data = readData();

  const newEntry = {
    id: crypto.randomUUID(),
    session_id,
    user_text,
    timestamp: new Date().toISOString(),
  };

  data.push(newEntry);
  writeData(data);

  res.json({ success: true, message: newEntry });
});


app.get("/messages", (req, res) => {
  const data = readData();
  res.json(data);
});


app.get("/messages/:session_id", (req, res) => {
  const { session_id } = req.params;
  const data = readData();

  const sessionMessages = data.filter(
    (msg) => msg.session_id === session_id
  );

  res.json(sessionMessages);
});


app.delete("/messages/:session_id", (req, res) => {
  const { session_id } = req.params;
  const data = readData();

  const filtered = data.filter(
    (msg) => msg.session_id !== session_id
  );

  writeData(filtered);

  res.json({ success: true });
});
