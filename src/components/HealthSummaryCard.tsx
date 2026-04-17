import { forwardRef } from "react";
import { Droplets, Flame, Award, HeartPulse } from "lucide-react";
import { loadStats, todayWaterMl, streakDays, getReferralLink } from "@/lib/stats";

interface Props {
  title?: string;
}

export const HealthSummaryCard = forwardRef<HTMLDivElement, Props>(({ title = "My Wellness Check" }, ref) => {
  const stats = loadStats();
  const ml = todayWaterMl();
  const streak = streakDays();
  const link = getReferralLink();
  const date = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div
      ref={ref}
      className="w-[360px] rounded-2xl p-6 text-foreground"
      style={{
        background: "linear-gradient(160deg, hsl(var(--primary) / 0.12), hsl(var(--background)))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
            <HeartPulse className="h-4 w-4 text-primary" />
          </div>
          <span className="font-display font-bold text-sm">Talk To Heal</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{date}</span>
      </div>

      <h3 className="font-display text-xl font-bold mb-4">{title}</h3>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <Stat icon={<Droplets className="h-4 w-4" />} label="Water" value={`${ml}ml`} />
        <Stat icon={<Flame className="h-4 w-4" />} label="Streak" value={`${streak}d`} />
        <Stat icon={<Award className="h-4 w-4" />} label="Points" value={`${stats.waterPoints}`} />
      </div>

      <div className="rounded-lg bg-primary/10 p-3 text-xs text-center text-primary font-medium mb-3">
        Stay hydrated. Stay healthy. 💧
      </div>

      <div className="border-t border-border pt-3 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">Powered by Talk To Heal</span>
        <span className="text-[10px] font-mono text-primary truncate max-w-[160px]">{link.replace(/^https?:\/\//, "")}</span>
      </div>
    </div>
  );
});

HealthSummaryCard.displayName = "HealthSummaryCard";

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background/60 border border-border p-2 text-center">
      <div className="flex justify-center text-primary mb-1">{icon}</div>
      <div className="font-display font-bold text-sm">{value}</div>
      <div className="text-[9px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}
