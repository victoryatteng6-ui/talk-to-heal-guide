import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Lock, Users, Share2, CreditCard, FlaskConical, Award, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadStats } from "@/lib/stats";

const ADMIN_PASSCODE = "ceo2025";
const SESSION_KEY = "healthvoice.admin.session";

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === ADMIN_PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
    } else {
      setError("Incorrect passcode.");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setAuthed(false);
    setPasscode("");
  };

  if (!authed) {
    return (
      <div className="container max-w-md px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold">CEO Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Restricted access.</p>
          <form onSubmit={submit} className="mt-6 space-y-3 text-left">
            <Label htmlFor="pc">Passcode</Label>
            <Input id="pc" type="password" value={passcode} onChange={(e) => { setPasscode(e.target.value); setError(""); }}
              placeholder="Enter passcode" autoFocus />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full">Unlock</Button>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Demo passcode: <code className="font-mono">{ADMIN_PASSCODE}</code>
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  const s = loadStats();
  const cards = [
    { icon: Users, label: "Users (this device only)", value: 1, hint: "Phase 2 enables real cross-device tracking" },
    { icon: Share2, label: "Reports shared", value: s.shares },
    { icon: Share2, label: "Referral clicks", value: s.referralClicks, hint: "Tracked when visitors land with ?ref=" },
    { icon: CreditCard, label: "Premium purchases", value: s.premiumPurchases },
    { icon: CreditCard, label: "Revenue (NGN)", value: `₦${s.premiumRevenueNGN.toLocaleString()}` },
    { icon: FlaskConical, label: "Lab bookings", value: s.labBookings },
    { icon: Award, label: "Health Points awarded", value: s.waterPoints },
  ];

  return (
    <div className="container max-w-5xl px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">CEO Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your referral code: <span className="font-mono text-primary">{s.referralCode}</span></p>
        </div>
        <Button variant="outline" onClick={logout}>Lock</Button>
      </div>

      <div className="rounded-xl border border-[hsl(var(--disclaimer-border))] bg-[hsl(var(--disclaimer))] p-4 flex items-start gap-3">
        <ShieldAlert className="h-5 w-5 text-[hsl(var(--disclaimer-foreground))] shrink-0 mt-0.5" />
        <p className="text-sm text-[hsl(var(--disclaimer-foreground))]">
          <strong>Phase 1 demo:</strong> these metrics come from local storage on this device only.
          Enable backend + auth (Phase 2) for real, multi-device analytics.
        </p>
      </div>

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
              {c.hint && <p className="mt-1 text-[11px] text-muted-foreground">{c.hint}</p>}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
