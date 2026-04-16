import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Plus, Award, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logWater, todayWaterMl, streakDays, loadStats } from "@/lib/stats";

const GOAL_ML = 2000;

export function WaterTracker() {
  const [ml, setMl] = useState(0);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setMl(todayWaterMl());
    setPoints(loadStats().waterPoints);
    setStreak(streakDays());
  }, []);

  const add = (amount: number) => {
    const s = logWater(amount);
    setMl(todayWaterMl());
    setPoints(s.waterPoints);
    setStreak(streakDays());
  };

  const pct = Math.min(100, Math.round((ml / GOAL_ML) * 100));

  return (
    <section className="container max-w-3xl px-4 py-10" aria-labelledby="water-h">
      <h2 id="water-h" className="mb-2 text-center font-display text-2xl font-bold">
        Daily Water Tracker
      </h2>
      <p className="mb-8 text-center text-sm text-muted-foreground">
        Stay hydrated. Earn Health Points. Build a streak.
      </p>

      <div className="grid gap-6 sm:grid-cols-3">
        {/* Progress ring */}
        <div className="sm:col-span-2 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-6">
            <ProgressRing pct={pct} />
            <div className="flex-1">
              <div className="flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-primary">{ml}</span>
                <span className="text-muted-foreground">/ {GOAL_ML} ml</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Today's intake</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[150, 250, 500, 750].map((amt) => (
                  <Button key={amt} variant="outline" size="sm" onClick={() => add(amt)}>
                    <Plus className="h-3 w-3 mr-1" /> {amt} ml
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          <StatCard icon={<Award className="h-5 w-5" />} label="Health Points" value={points} />
          <StatCard icon={<Flame className="h-5 w-5" />} label="Day streak" value={streak} />
        </div>
      </div>
    </section>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <span className="font-display text-3xl font-bold text-foreground">{value}</span>
      </div>
      <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    </motion.div>
  );
}

function ProgressRing({ pct }: { pct: number }) {
  const size = 120, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--muted))" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          stroke="hsl(var(--primary))" strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Droplets className="h-5 w-5 text-primary" />
        <span className="font-display text-xl font-bold mt-1">{pct}%</span>
      </div>
    </div>
  );
}
