import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Loader2, Check, FileDown, ShieldCheck, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generatePremiumPdf } from "@/lib/premiumPdf";
import { openPaystackCheckout } from "@/lib/paystack";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PRICE_NGN = 2500;
const PRICE_KOBO = PRICE_NGN * 100;

interface Props {
  conversation?: { role: string; content: string }[];
}

export function PremiumReportButton({ conversation }: Props) {
  const { toast } = useToast();
  const { user, session } = useAuth();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"intro" | "processing" | "success">("intro");

  const close = () => { setOpen(false); setTimeout(() => setStage("intro"), 300); };

  const startPayment = async () => {
    if (!user || !session) return;
    try {
      await openPaystackCheckout({
        email: user.email ?? "",
        amountKobo: PRICE_KOBO,
        onClose: () => {
          if (stage !== "success") toast({ title: "Payment cancelled", description: "You can try again anytime." });
        },
        onSuccess: async (reference) => {
          // Immediately reflect success in the UI so the popup close doesn't leave the user hanging.
          setOpen(true);
          setStage("processing");
          toast({ title: "Payment Successful", description: "Verifying your transaction…" });

          try {
            const { data, error } = await supabase.functions.invoke("verify-paystack", {
              body: { reference },
            });
            if (error || !(data as { success?: boolean })?.success) {
              toast({
                title: "Verification pending",
                description: `Payment received (ref: ${reference}). If premium doesn't unlock shortly, contact support.`,
              });
            } else {
              toast({ title: "Premium unlocked", description: "Your account is now Premium." });
            }
          } catch (err) {
            toast({
              title: "Verification error",
              description: (err as Error).message,
            });
          }
          // Always advance to success so the user can download the report.
          setStage("success");
        },
      });
    } catch (e) {
      toast({ title: "Could not start checkout", description: (e as Error).message, variant: "destructive" });
    }
  };

  const downloadPdf = () => {
    const doc = generatePremiumPdf({ conversation });
    doc.save("talk-to-heal-premium-report.pdf");
    toast({ title: "Downloaded", description: "Premium report saved." });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
          <Crown className="h-4 w-4" />
          Buy Premium Report (₦{PRICE_NGN.toLocaleString()})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        {stage === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Premium Health Report</DialogTitle>
              <DialogDescription>
                Detailed PDF summary of your triage, profile, and wellness — formatted for sharing with your doctor.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-2 text-sm">
              {[
                "Your full health profile included",
                "Triage conversation summary",
                "Wellness snapshot (water, streak, points)",
                "Personalized recommendations",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5" /> {f}</li>
              ))}
            </ul>
            <div className="flex items-center justify-between rounded-xl bg-primary/10 p-4">
              <span className="text-sm text-muted-foreground">One-time</span>
              <span className="font-display text-2xl font-bold text-primary">₦{PRICE_NGN.toLocaleString()}</span>
            </div>
            {user ? (
              <Button onClick={startPayment} className="w-full">
                <ShieldCheck className="h-4 w-4 mr-2" /> Pay with Paystack
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link to="/auth"><LogIn className="h-4 w-4 mr-2" /> Sign in to purchase</Link>
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center">Secured by Paystack. NGN only.</p>
          </>
        )}

        {stage === "processing" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verifying payment…</p>
          </div>
        )}

        {stage === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold">Payment successful</h3>
            <p className="text-sm text-muted-foreground">Premium unlocked on your account. Your report is ready.</p>
            <Button onClick={downloadPdf} className="w-full"><FileDown className="h-4 w-4 mr-2" /> Download Report</Button>
            <Button variant="ghost" onClick={close} className="w-full">Close</Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
