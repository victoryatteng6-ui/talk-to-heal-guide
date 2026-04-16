import { useState } from "react";
import { motion } from "framer-motion";
import { Crown, Loader2, Check, FileDown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generatePremiumPdf } from "@/lib/premiumPdf";
import { bump } from "@/lib/stats";

const PRICE_NGN = 500;

interface Props {
  conversation?: { role: string; content: string }[];
}

export function PremiumReportButton({ conversation }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"intro" | "pay" | "processing" | "success">("intro");

  const close = () => { setOpen(false); setTimeout(() => setStage("intro"), 300); };

  const startPayment = () => setStage("pay");

  const fakeCharge = async () => {
    setStage("processing");
    await new Promise((r) => setTimeout(r, 1400));
    bump("premiumPurchases", 1);
    bump("premiumRevenueNGN", PRICE_NGN);
    setStage("success");
  };

  const downloadPdf = () => {
    const doc = generatePremiumPdf({ conversation });
    doc.save("healthvoice-premium-report.pdf");
    toast({ title: "Downloaded", description: "Premium report saved." });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/10">
          <Crown className="h-4 w-4" />
          Premium Report
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
              <span className="font-display text-2xl font-bold text-primary">₦{PRICE_NGN}</span>
            </div>
            <Button onClick={startPayment} className="w-full">Continue to payment</Button>
            <p className="text-xs text-muted-foreground text-center">Demo checkout — no real charge.</p>
          </>
        )}

        {stage === "pay" && (
          <>
            <DialogHeader>
              <DialogTitle>Secure Checkout</DialogTitle>
              <DialogDescription>Paystack-style demo — fields are not validated.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-background p-3">
                <label className="text-xs text-muted-foreground">Card number</label>
                <input defaultValue="4084 0840 0000 0000" className="block w-full bg-transparent text-sm font-mono outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border bg-background p-3">
                  <label className="text-xs text-muted-foreground">Expiry</label>
                  <input defaultValue="12/29" className="block w-full bg-transparent text-sm outline-none" />
                </div>
                <div className="rounded-lg border border-border bg-background p-3">
                  <label className="text-xs text-muted-foreground">CVV</label>
                  <input defaultValue="123" className="block w-full bg-transparent text-sm outline-none" />
                </div>
              </div>
              <Button onClick={fakeCharge} className="w-full">Pay ₦{PRICE_NGN}</Button>
              <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-3 w-3" /> Demo only — no real payment processor connected.</p>
            </div>
          </>
        )}

        {stage === "processing" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Processing payment…</p>
          </div>
        )}

        {stage === "success" && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/15">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold">Payment successful</h3>
            <p className="text-sm text-muted-foreground">Your Premium Report is ready to download.</p>
            <Button onClick={downloadPdf} className="w-full"><FileDown className="h-4 w-4 mr-2" /> Download PDF</Button>
            <Button variant="ghost" onClick={close} className="w-full">Close</Button>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
