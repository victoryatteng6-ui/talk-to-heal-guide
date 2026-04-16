// Lightweight local-only stats store. In Phase 2 these move to the database.
type Stats = {
  shares: number;
  referralClicks: number;
  premiumPurchases: number;
  premiumRevenueNGN: number;
  labBookings: number;
  waterPoints: number;
  waterLogs: { date: string; ml: number }[]; // YYYY-MM-DD
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

export function bump<K extends keyof Stats>(key: K, by: Stats[K] extends number ? number : never) {
  const s = loadStats();
  // @ts-expect-error numeric increment for numeric keys
  s[key] = ((s[key] as unknown as number) || 0) + (by as unknown as number);
  saveStats(s);
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
  s.waterPoints += Math.max(1, Math.round(ml / 100)); // 1 point per 100ml
  saveStats(s);
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
