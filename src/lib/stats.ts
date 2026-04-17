// Hybrid stats store: when a user is signed in, mirrors writes to Supabase.
// When anonymous, falls back to localStorage so the existing UI keeps working.
import { supabase } from "@/integrations/supabase/client";

type Stats = {
  shares: number;
  referralClicks: number;
  premiumPurchases: number;
  premiumRevenueNGN: number;
  labBookings: number;
  waterPoints: number;
  waterLogs: { date: string; ml: number }[];
  installedAt: string;
  referralCode: string;
};

const KEY = "healthvoice.stats.v1";

function makeCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function defaults(): Stats {
  return {
    shares: 0,
    referralClicks: 0,
    premiumPurchases: 0,
    premiumRevenueNGN: 0,
    labBookings: 0,
    waterPoints: 0,
    waterLogs: [],
    installedAt: new Date().toISOString(),
    referralCode: makeCode(),
  };
}

export function loadStats(): Stats {
  if (typeof window === "undefined") return defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const d = defaults();
      localStorage.setItem(KEY, JSON.stringify(d));
      return d;
    }
    return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    return defaults();
  }
}

export function saveStats(s: Stats) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

async function getCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Backwards-compatible bump. Also mirrors specific events to the DB. */
export function bump<K extends keyof Stats>(key: K, by: Stats[K] extends number ? number : never) {
  const s = loadStats();
  // @ts-expect-error numeric increment for numeric keys
  s[key] = ((s[key] as unknown as number) || 0) + (by as unknown as number);
  saveStats(s);

  // Best-effort DB mirror (fire-and-forget; respects RLS).
  (async () => {
    try {
      const userId = await getCurrentUserId();
      if (key === "shares") {
        await supabase.from("share_events").insert({ user_id: userId, channel: "generic" });
      } else if (key === "labBookings") {
        await supabase.from("lab_events").insert({ user_id: userId, kind: "lab_booking" });
      } else if (key === "premiumPurchases" && userId) {
        await supabase.from("premium_purchases").insert({
          user_id: userId,
          amount: 500,
          currency: "NGN",
          status: "completed",
        });
      } else if (key === "referralClicks") {
        const code = sessionStorage.getItem("healthvoice.lastref") || "unknown";
        await supabase.from("referrals").insert({ referral_code: code, user_id: userId });
      }
    } catch {
      // ignore — local state is already updated.
    }
  })();

  return s;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function logWater(ml: number) {
  const s = loadStats();
  const today = todayKey();
  const existing = s.waterLogs.find((l) => l.date === today);
  if (existing) existing.ml += ml;
  else s.waterLogs.push({ date: today, ml });
  s.waterPoints += Math.max(1, Math.round(ml / 100));
  saveStats(s);

  (async () => {
    try {
      const userId = await getCurrentUserId();
      if (userId) {
        await supabase.from("water_logs").insert({ user_id: userId, ml, log_date: today });
      }
    } catch { /* ignore */ }
  })();

  return s;
}

export function todayWaterMl(): number {
  const s = loadStats();
  return s.waterLogs.find((l) => l.date === todayKey())?.ml ?? 0;
}

export function streakDays(): number {
  const s = loadStats();
  const days = new Set(s.waterLogs.filter((l) => l.ml >= 500).map((l) => l.date));
  let n = 0;
  const d = new Date();
  while (days.has(d.toISOString().slice(0, 10))) {
    n++; d.setDate(d.getDate() - 1);
  }
  return n;
}

export function getReferralLink(): string {
  const s = loadStats();
  const base = typeof window !== "undefined" ? window.location.origin : "";
  return `${base}/?ref=${s.referralCode}`;
}
