import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Share2, CreditCard, FlaskConical, Award, ShieldAlert, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Metrics {
  totalUsers: number;
  shares: number;
  referrals: number;
  premiumCount: number;
  premiumRevenue: number;
  labEvents: number;
  waterPoints: number;
}

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const [usersR, sharesR, refsR, premR, labR, waterR] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("share_events").select("id", { count: "exact", head: true }),
          supabase.from("referrals").select("id", { count: "exact", head: true }),
          supabase.from("premium_purchases").select("amount, status"),
          supabase.from("lab_events").select("id", { count: "exact", head: true }),
          supabase.from("water_logs").select("ml"),
        ]);

        const completed = (premR.data ?? []).filter((p) => p.status === "completed");
        const waterPoints = (waterR.data ?? []).reduce(
          (sum, r: { ml: number }) => sum + Math.max(1, Math.round(r.ml / 100)),
          0
        );

        setMetrics({
          totalUsers: usersR.count ?? 0,
          shares: sharesR.count ?? 0,
          referrals: refsR.count ?? 0,
          premiumCount: completed.length,
          premiumRevenue: completed.reduce((s, p) => s + Number(p.amount), 0),
          labEvents: labR.count ?? 0,
          waterPoints,
        });
      } finally {
        setLoadingMetrics(false);
      }
    })();
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="container max-w-md px-4 py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!isAdmin) {
    return (
      <div className="container max-w-md px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-bold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This dashboard is restricted to administrators. If you should have access,
            ask another admin to grant you the <span className="font-mono">admin</span> role
            in the <span className="font-mono">user_roles</span> table.
          </p>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const cards = metrics
    ? [
        { icon: Users, label: "Total users", value: metrics.totalUsers },
        { icon: Share2, label: "Reports shared", value: metrics.shares },
        { icon: Share2, label: "Referral landings", value: metrics.referrals },
        { icon: CreditCard, label: "Premium purchases", value: metrics.premiumCount },
        { icon: CreditCard, label: "Revenue (NGN)", value: `₦${metrics.premiumRevenue.toLocaleString()}` },
        { icon: FlaskConical, label: "Lab / consult clicks", value: metrics.labEvents },
        { icon: Award, label: "Health points awarded", value: metrics.waterPoints },
      ]
    : [];

  return (
    <div className="container max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">CEO Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time metrics across all users.</p>
        </div>
        <Button variant="outline" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>

      {loadingMetrics ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <motion.div key={c.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-display text-2xl font-bold">{c.value}</span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">{c.label}</p>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
