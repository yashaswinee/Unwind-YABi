const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export type ScheduledMeet = {
  id: string;
  counsellorName: string;
  datetime: string;
  createdAt?: string;
};

export async function fetchScheduledMeets(): Promise<ScheduledMeet[]> {
  const res = await fetch(`${API_BASE}/api/scheduled-meets`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.meets ?? [];
}

export async function createScheduledMeet(counsellorName: string, datetime: string): Promise<ScheduledMeet> {
  const res = await fetch(`${API_BASE}/api/scheduled-meets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ counsellorName, datetime }),
  });
  if (!res.ok) throw new Error("Failed to schedule meet");
  const data = await res.json();
  return data.meet;
}
