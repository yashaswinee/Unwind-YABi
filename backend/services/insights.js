/**
 * Mental health insights from active (chat) and passive writing stored in JSON.
 * Uses sentiment analysis + theme keywords for mood, energy, burnout, themes.
 * Threshold-based signals and counselor intervention recommendation (WHO-aligned).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Sentiment from "sentiment";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, "..", "data");
const CHAT_PATH = path.join(DATA_DIR, "chat-log.json");
const PASSIVE_PATH = path.join(DATA_DIR, "passive-writing.json");
const INSIGHTS_CACHE_PATH = path.join(DATA_DIR, "insights-cache.json");
const SIGNALS_PATH = path.join(DATA_DIR, "signals.json");

const sentiment = new Sentiment();

// Theme keywords (mental health / wellbeing). Count mentions per theme.
const THEME_KEYWORDS = {
  "Work pressure": [
    "deadline", "pressure", "sprint", "rush", "urgent", "overwhelm", "overwhelmed",
    "workload", "stress", "stressed", "busy", "exhausted", "meeting", "boss", "job",
    "career", "project", "delivery", "overtime", "burnout", "burned out",
  ],
  "Sleep quality": [
    "sleep", "slept", "insomnia", "tired", "rest", "night", "wake", "dream",
    "nightmare", "fatigue", "exhausted", "can't sleep", "overslept",
  ],
  "Social connection": [
    "alone", "isolat", "lonely", "loneliness", "friend", "family", "relationship",
    "disconnect", "nobody", "someone", "talk", "support", "understood",
    "left out", "ignored", "rejected",
  ],
  "Self-doubt": [
    "doubt", "failure", "fail", "worth", "enough", "imposter", "stupid",
    "anxious", "anxiety", "worry", "worried", "panic", "can't", "cannot",
    "hopeless", "useless", "guilty", "guilt", "ashamed",
  ],
  "Mood / emotions": [
    "sad", "sadness", "angry", "anger", "frustrat", "cry", "crying",
    "happy", "joy", "calm", "peace", "grateful", "relieved", "hopeful",
  ],
  "Health / body": [
    "health", "pain", "sick", "ill", "headache", "body", "exercise",
    "eat", "eating", "diet", "energy", "motivation", "motivated",
  ],
};

// Burnout / high-risk indicators (increase burnout score when present).
const BURNOUT_INDICATORS = [
  "burnout", "burned out", "exhausted", "drained", "can't cope", "cant cope",
  "overwhelm", "overwhelmed", "collapse", "breaking down", "breaking point",
  "no energy", "empty", "numb", "detach", "cynical", "hopeless",
  "don't care", "dont care", "giving up", "quit", "resign",
];

// Counselor intervention: threshold (burnout % and/or sustained low mood).
const BURNOUT_INTERVENTION_THRESHOLD = 70;
const LOW_MOOD_THRESHOLD = 3.5; // avg mood (1-10) below this over window
const LOW_MOOD_DAYS_FOR_INTERVENTION = 5; // days with avg mood below threshold

const DAYS_FOR_CHART = 7;
const SIGNALS_TO_KEEP = 20;

// --- Helpers ---

function readJson(filePath, defaultValue = {}) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const raw = fs.readFileSync(filePath, "utf-8").trim();
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (e) {
    console.error("readJson error", filePath, e.message);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function toDateKey(isoString) {
  return isoString ? isoString.slice(0, 10) : "";
}

/** Sentiment compound -> mood 1-10. */
function compoundToMood(compound) {
  if (compound == null) return 5;
  // compound typically -1..1
  const normalized = (compound + 1) / 2; // 0..1
  return Math.round(1 + normalized * 9) || 5;
}

/** Analyze a single text: sentiment + themes + burnout flags. */
function analyzeText(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed.length) return null;

  const sent = sentiment.analyze(trimmed);
  // comparative = score/wordCount, roughly in [-1,1] range
  const compound = sent.comparative !== undefined ? Math.max(-1, Math.min(1, sent.comparative)) : (sent.score > 0 ? 0.3 : sent.score < 0 ? -0.3 : 0);
  const mood = compoundToMood(compound);

  const lower = trimmed.toLowerCase();
  const themeCounts = {};
  for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
    let count = 0;
    for (const kw of keywords) {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = lower.match(regex);
      if (matches) count += matches.length;
    }
    if (count > 0) themeCounts[theme] = count;
  }

  let burnoutHits = 0;
  for (const ind of BURNOUT_INDICATORS) {
    if (lower.includes(ind)) burnoutHits += 1;
  }

  return {
    mood,
    compound,
    themeCounts,
    burnoutHits,
    wordCount: trimmed.split(/\s+/).length,
  };
}

/** Collect all user text from chat + passive with timestamps. */
function collectUserWritings(chatLog, passiveData) {
  const entries = [];

  for (const [sessionId, session] of Object.entries(chatLog || {})) {
    const messages = session.messages || [];
    for (const msg of messages) {
      if (msg.role === "user" && msg.text) {
        entries.push({
          source: "active",
          sessionId,
          text: msg.text,
          timestamp: msg.timestamp || session.created_at,
        });
      }
    }
  }

  for (const [sessionId, rec] of Object.entries(passiveData || {})) {
    const content = rec.content;
    if (content && typeof content === "string") {
      entries.push({
        source: "passive",
        sessionId,
        text: content,
        timestamp: rec.updated_at || rec.created_at,
      });
    }
  }

  return entries.sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));
}

/** Aggregate by day for chart and streaks. */
function aggregateByDay(entries) {
  const byDay = {};
  for (const e of entries) {
    const res = analyzeText(e.text);
    if (!res) continue;
    const day = toDateKey(e.timestamp);
    if (!day) continue;
    if (!byDay[day]) {
      byDay[day] = { moods: [], energies: [], burnoutHits: 0, themeCounts: {}, entries: 0 };
    }
    byDay[day].moods.push(res.mood);
    byDay[day].energies.push(Math.min(10, res.mood + (res.wordCount > 20 ? 1 : 0))); // simple energy proxy
    byDay[day].burnoutHits += res.burnoutHits;
    byDay[day].entries += 1;
    for (const [theme, count] of Object.entries(res.themeCounts)) {
      byDay[day].themeCounts[theme] = (byDay[day].themeCounts[theme] || 0) + count;
    }
  }
  return byDay;
}

/** Build chart data for last N days. */
function buildChartData(byDay) {
  const now = new Date();
  const result = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = DAYS_FOR_CHART - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const dayRec = byDay[key];
    const mood = dayRec && dayRec.moods.length
      ? Math.round(dayRec.moods.reduce((a, b) => a + b, 0) / dayRec.moods.length * 10) / 10
      : null;
    const energy = dayRec && dayRec.energies.length
      ? Math.round(dayRec.energies.reduce((a, b) => a + b, 0) / dayRec.energies.length * 10) / 10
      : null;
    result.push({
      day: dayNames[d.getDay()],
      dateKey: key,
      mood: mood != null ? mood : 5,
      energy: energy != null ? energy : 5,
    });
  }
  return result;
}

/** Top themes across all data. */
function buildTopThemes(byDay) {
  const totals = {};
  for (const rec of Object.values(byDay)) {
    for (const [theme, count] of Object.entries(rec.themeCounts || {})) {
      totals[theme] = (totals[theme] || 0) + count;
    }
  }
  return Object.entries(totals)
    .map(([label, count]) => ({ label, count, trend: "up" }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

/** Burnout score 0-100 from sentiment trend + burnout keywords + engagement. */
function computeBurnoutScore(byDay, entries) {
  const days = Object.values(byDay);
  if (days.length === 0) return 0;

  let score = 0;
  let totalBurnoutHits = 0;
  let totalMood = 0;
  let moodCount = 0;

  for (const d of days) {
    totalBurnoutHits += d.burnoutHits || 0;
    if (d.moods && d.moods.length) {
      d.moods.forEach((m) => { totalMood += m; moodCount += 1; });
    }
  }

  const avgMood = moodCount ? totalMood / moodCount : 5;
  // Low average mood increases burnout score
  if (avgMood < 4) score += 35;
  else if (avgMood < 5) score += 20;
  else if (avgMood < 6) score += 10;

  // Burnout keyword hits
  const hitPenalty = Math.min(40, totalBurnoutHits * 8);
  score += hitPenalty;

  // Short entries / drop in engagement can indicate withdrawal (simplified)
  const avgEntriesPerDay = days.length ? (entries.length / days.length) : 0;
  if (avgEntriesPerDay < 0.5 && days.length >= 3) score += 15;

  return Math.min(100, Math.round(score));
}

/** Streak: consecutive days with at least one entry. */
function computeStreak(byDay) {
  const sorted = Object.keys(byDay).sort();
  if (sorted.length === 0) return 0;
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let d = new Date(today);
  for (;;) {
    const key = d.toISOString().slice(0, 10);
    if (byDay[key]) streak++;
    else break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

/** Human-like signals to nudge wellbeing / interaction. */
function generateSignals(entries, byDay, burnoutScore, topThemes, avgMood) {
  const signals = [];
  const now = new Date();

  if (entries.length === 0) {
    signals.push({
      id: "no-entries",
      text: "You haven’t written in a while. Want to take a moment to check in with yourself?",
      type: "engagement",
      createdAt: now.toISOString(),
    });
    return signals;
  }

  // Low mood / burnout
  if (burnoutScore >= 50 && burnoutScore < BURNOUT_INTERVENTION_THRESHOLD) {
    signals.push({
      id: "burnout-caution",
      text: "Your recent entries suggest you might be under a lot of pressure. How about a short break or something that helps you recharge?",
      type: "wellbeing",
      createdAt: now.toISOString(),
    });
  }

  if (avgMood < 4.5 && entries.length >= 2) {
    signals.push({
      id: "low-mood",
      text: "It sounds like things have been heavy lately. Would you like to talk or try a quick grounding exercise?",
      type: "support",
      createdAt: now.toISOString(),
    });
  }

  // Top theme nudge
  const top = topThemes[0];
  if (top && top.count >= 3) {
    signals.push({
      id: "theme-nudge",
      text: `You’ve been writing a lot about "${top.label}" recently. How does that feel right now?`,
      type: "reflection",
      createdAt: now.toISOString(),
    });
  }

  // Engagement: shorter than usual
  const recent = entries.slice(-10);
  const avgLen = recent.reduce((a, e) => a + (e.text || "").length, 0) / (recent.length || 1);
  if (entries.length >= 5 && avgLen < 50) {
    signals.push({
      id: "short-entries",
      text: "Your last few entries have been shorter than usual. Everything okay? We’re here if you want to unpack anything.",
      type: "engagement",
      createdAt: now.toISOString(),
    });
  }

  // General wellbeing
  signals.push({
    id: "wellbeing",
    text: "Small steps count. Have you had a moment today to do something that feels good for you?",
    type: "wellbeing",
    createdAt: now.toISOString(),
  });

  return signals;
}

/** Whether to recommend counselor (threshold). */
function shouldRecommendCounselor(burnoutScore, byDay, avgMood) {
  if (burnoutScore >= BURNOUT_INTERVENTION_THRESHOLD) return true;
  const sortedDays = Object.entries(byDay)
    .map(([dateKey, rec]) => ({
      dateKey,
      avgMood: rec.moods?.length ? rec.moods.reduce((a, b) => a + b, 0) / rec.moods.length : 5,
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey))
    .slice(0, 7);
  const lowDays = sortedDays.filter((d) => d.avgMood < LOW_MOOD_THRESHOLD).length;
  if (lowDays >= LOW_MOOD_DAYS_FOR_INTERVENTION || avgMood < 3) return true;
  return false;
}

/** Persist and return signals (append new, dedupe by id, keep last N). */
function persistSignals(newSignals) {
  const existing = readJson(SIGNALS_PATH, []);
  const byId = new Map(existing.map((s) => [s.id, s]));
  for (const s of newSignals) {
    byId.set(s.id, s);
  }
  const list = Array.from(byId.values())
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, SIGNALS_TO_KEEP);
  writeJson(SIGNALS_PATH, list);
  return list;
}

// --- Main compute ---

export function computeInsights() {
  const chatLog = readJson(CHAT_PATH);
  const passiveData = readJson(PASSIVE_PATH);

  const entries = collectUserWritings(chatLog, passiveData);
  const byDay = aggregateByDay(entries);

  const chartData = buildChartData(byDay);
  const topThemes = buildTopThemes(byDay);
  const burnoutScore = computeBurnoutScore(byDay, entries);
  const streak = computeStreak(byDay);

  const allMoods = [];
  for (const rec of Object.values(byDay)) {
    if (rec.moods) allMoods.push(...rec.moods);
  }
  const avgMood = allMoods.length
    ? Math.round(allMoods.reduce((a, b) => a + b, 0) / allMoods.length * 10) / 10
    : 5.6;

  const signals = generateSignals(entries, byDay, burnoutScore, topThemes, avgMood);
  const signalsList = persistSignals(signals);

  const recommendCounselor = shouldRecommendCounselor(burnoutScore, byDay, avgMood);

  const payload = {
    avgMood,
    entriesCount: entries.length,
    streak,
    burnoutScore,
    mentalEnergyChart: chartData,
    topThemes,
    signals: signalsList,
    recommendCounselor,
    lastComputed: new Date().toISOString(),
  };

  writeJson(INSIGHTS_CACHE_PATH, payload);
  return payload;
}

export function getInsights(forceRefresh = false) {
  const cache = readJson(INSIGHTS_CACHE_PATH, null);
  if (!forceRefresh && cache && cache.lastComputed) {
    const age = Date.now() - new Date(cache.lastComputed).getTime();
    if (age < 60 * 1000) return cache; // 1 min TTL
  }
  return computeInsights();
}

export function getSignalsOnly() {
  const cache = readJson(INSIGHTS_CACHE_PATH, null);
  if (cache && cache.signals) return cache.signals;
  const payload = computeInsights();
  return payload.signals;
}
