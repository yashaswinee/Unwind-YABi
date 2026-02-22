const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001";

export interface JournalLogEntry {
  date: string;
  time: string;
  user_text: string;
  created_at?: string;
}

/**
 * Save a journal log entry to the backend.
 */
export async function saveJournalLog(log: JournalLogEntry): Promise<JournalLogEntry> {
  const res = await fetch(`${API_BASE}/api/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(log),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Failed to save journal log:", err);
    throw new Error("Failed to save journal log");
  }

  const data = await res.json();
  return data.entry;
}

/**
 * Fetch journal logs.
 * - No args → all logs
 * - { date } → logs for a specific date
 * - { from, to } → logs in a date range
 */
export async function fetchJournalLogs(params?: {
  date?: string;
  from?: string;
  to?: string;
}): Promise<JournalLogEntry[]> {
  const url = new URL(`${API_BASE}/api/logs`);
  if (params?.date) url.searchParams.set("date", params.date);
  if (params?.from) url.searchParams.set("from", params.from);
  if (params?.to) url.searchParams.set("to", params.to);

  const res = await fetch(url.toString());
  if (!res.ok) {
    console.error("Failed to fetch journal logs");
    return [];
  }

  const data = await res.json();
  return data.logs;
}

/**
 * Fetch the list of dates that have log entries.
 */
export async function fetchLogDates(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/logs/dates`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.dates;
}
