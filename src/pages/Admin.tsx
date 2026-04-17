import { motion } from "framer-motion";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Admin() {
  return (
    <div className="container max-w-md px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="h-6 w-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">CEO Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restricted access. Server-side authentication required.
        </p>

        <div className="mt-6 rounded-xl border border-[hsl(var(--disclaimer-border))] bg-[hsl(var(--disclaimer))] p-4 flex items-start gap-3 text-left">
          <ShieldAlert className="h-5 w-5 text-[hsl(var(--disclaimer-foreground))] shrink-0 mt-0.5" />
          <p className="text-sm text-[hsl(var(--disclaimer-foreground))]">
            This dashboard has been temporarily disabled while we migrate to secure
            server-side authentication with proper admin roles.
          </p>
        </div>

        <Button asChild variant="outline" className="mt-6 w-full">
          <Link to="/">Back to home</Link>
        </Button>
      </motion.div>
    </div>
  );
}
