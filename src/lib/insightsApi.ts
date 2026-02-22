/**
 * API client for mental health insights and signals (from backend NLP on journal/passive writing).
 */

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export type InsightTheme = {
  label: string;
  count: number;
  trend: "up" | "down";
};

export type InsightSignal = {
  id: string;
  text: string;
  type: string;
  createdAt: string;
};

export type InsightsPayload = {
  avgMood: number;
  entriesCount: number;
  streak: number;
  burnoutScore: number;
  mentalEnergyChart: Array<{ day: string; dateKey?: string; mood: number; energy: number }>;
  topThemes: InsightTheme[];
  signals: InsightSignal[];
  recommendCounselor: boolean;
  lastComputed?: string;
};

export async function fetchInsights(forceRefresh = false): Promise<InsightsPayload> {
  const url = `${API_BASE}/api/insights${forceRefresh ? "?refresh=true" : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch insights");
  return res.json();
}

export async function fetchSignals(): Promise<InsightSignal[]> {
  const res = await fetch(`${API_BASE}/api/signals`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.signals ?? [];
}
