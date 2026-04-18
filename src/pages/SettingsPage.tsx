import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Volume2, Type, Palette, Globe, Crown, ExternalLink, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SettingsState {
  voiceSpeed: number;
  language: string;
  textSize: string;
  theme: string;
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<SettingsState>({
    voiceSpeed: 1,
    language: "en",
    textSize: "medium",
    theme: "light",
  });
  const [premium, setPremium] = useState<{ status: boolean; since: string | null } | null>(null);

  const update = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (!user) { setPremium(null); return; }
    supabase
      .from("profiles")
      .select("premium_status, premium_since")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setPremium({ status: !!data.premium_status, since: data.premium_since });
      });
  }, [user]);

  return (
    <div className="container max-w-2xl px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your account and customize your experience.</p>
      </motion.div>

      <div className="mt-8 space-y-6">
        <SettingsCard icon={UserIcon} title="Account" description="Your sign-in and subscription status.">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Signed in as</span>
                <span className="font-medium text-foreground truncate max-w-[60%]">{user.email}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-primary" /> Premium</span>
                {premium?.status ? (
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-medium text-primary">
                    Active{premium.since ? ` · since ${new Date(premium.since).toLocaleDateString()}` : ""}
                  </span>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Free</span>
                )}
              </div>
              {!premium?.status && (
                <Button asChild variant="outline" className="w-full">
                  <Link to="/wellness"><Crown className="h-4 w-4 mr-2" /> Upgrade to Premium</Link>
                </Button>
              )}
              <Button variant="ghost" className="w-full" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" /> Sign out
              </Button>
            </div>
          ) : (
            <Button asChild className="w-full">
              <Link to="/auth"><LogIn className="h-4 w-4 mr-2" /> Sign in</Link>
            </Button>
          )}
          <a
            href="https://dashboard.paystack.com"
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" /> Open Paystack dashboard
          </a>
        </SettingsCard>

        {/* Voice Speed */}
        <SettingsCard icon={Volume2} title="Voice Speed" description="Adjust how fast the assistant speaks.">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={settings.voiceSpeed}
              onChange={(e) => update("voiceSpeed", parseFloat(e.target.value))}
              className="flex-1 accent-primary"
              aria-label="Voice speed"
            />
            <span className="w-12 text-right text-sm font-medium text-foreground">{settings.voiceSpeed}x</span>
          </div>
        </SettingsCard>

        {/* Language */}
        <SettingsCard icon={Globe} title="Language" description="Choose your preferred language.">
          <select
            value={settings.language}
            onChange={(e) => update("language", e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="pt">Português</option>
          </select>
        </SettingsCard>

        {/* Text Size */}
        <SettingsCard icon={Type} title="Text Size" description="Adjust text size for readability.">
          <div className="flex gap-2">
            {["small", "medium", "large"].map((size) => (
              <button
                key={size}
                onClick={() => update("textSize", size)}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  settings.textSize === size
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </SettingsCard>

        {/* Color Theme */}
        <SettingsCard icon={Palette} title="Color Theme" description="Switch between light and dark themes.">
          <div className="flex gap-2">
            {["light", "dark"].map((t) => (
              <button
                key={t}
                onClick={() => {
                  update("theme", t);
                  document.documentElement.classList.toggle("dark", t === "dark");
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  settings.theme === t
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </SettingsCard>
      </div>
    </div>
  );
}

function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-display text-base font-semibold text-card-foreground">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </motion.div>
  );
}
