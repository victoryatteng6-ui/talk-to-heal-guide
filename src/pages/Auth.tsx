import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/contexts/AuthContext";

const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "At least 8 characters").max(128),
});

const signupSchema = credentialsSchema.extend({
  displayName: z.string().trim().min(1, "Required").max(80),
});

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate("/", { replace: true });
  }, [session, navigate]);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentialsSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/", { replace: true });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse({
      displayName: signupName,
      email: signupEmail,
      password: signupPassword,
    });
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: parsed.data.displayName },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome!", description: "Your account is ready." });
    navigate("/", { replace: true });
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(false);
      toast({ title: "Google sign-in failed", description: String((result.error as Error).message ?? result.error), variant: "destructive" });
      return;
    }
    if (result.redirected) return; // browser will navigate
    navigate("/", { replace: true });
  }

  return (
    <div className="container max-w-md px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="flex items-center justify-center gap-2 font-display text-xl font-bold">
          <Heart className="h-6 w-6 text-primary" /> Talk To Heal
        </Link>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Sign in to track your wellness across devices.
        </p>

        <Button type="button" variant="outline" className="mt-6 w-full" onClick={handleGoogle} disabled={loading}>
          Continue with Google
        </Button>

        <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-3 pt-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input id="login-email" type="email" autoComplete="email" maxLength={255}
                  value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input id="login-password" type="password" autoComplete="current-password" maxLength={128}
                  value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Sign in
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignup} className="space-y-3 pt-4">
              <div>
                <Label htmlFor="signup-name">Display name</Label>
                <Input id="signup-name" maxLength={80}
                  value={signupName} onChange={(e) => setSignupName(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" autoComplete="email" maxLength={255}
                  value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="signup-password">Password (min 8 chars)</Label>
                <Input id="signup-password" type="password" autoComplete="new-password" maxLength={128}
                  value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create account
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
