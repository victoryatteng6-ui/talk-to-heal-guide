import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Download, Copy, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { generateShareCard } from "@/lib/shareCard";
import { bump, getReferralLink } from "@/lib/stats";

interface Props {
  triggerLabel?: string;
  className?: string;
}

export function ShareReportButton({ triggerLabel = "Share My Health Report", className }: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const link = getReferralLink();

  const generate = async () => {
    setLoading(true);
    try {
      const b = await generateShareCard();
      setBlob(b);
      setPreviewUrl(URL.createObjectURL(b));
      bump("shares", 1);
    } catch {
      toast({ variant: "destructive", title: "Could not generate image" });
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o && !previewUrl) generate();
  };

  const handleDownload = () => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "healthvoice-report.png";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleNativeShare = async () => {
    if (!blob) return;
    const file = new File([blob], "healthvoice-report.png", { type: "image/png" });
    const navAny = navigator as any;
    if (navAny.share && navAny.canShare?.({ files: [file] })) {
      try {
        await navAny.share({
          files: [file],
          title: "My HealthVoice wellness check",
          text: `Try HealthVoice → ${link}`,
        });
      } catch { /* user cancelled */ }
    } else {
      handleDownload();
      toast({ title: "Saved to your device", description: "Share it on WhatsApp or Instagram." });
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className={className} variant="default">
          <Share2 className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share your wellness check</DialogTitle>
          <DialogDescription>
            Optimized for WhatsApp Status & Instagram. Includes your referral link.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-muted/40 p-3 flex items-center justify-center min-h-[320px]">
          {loading || !previewUrl ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : (
            <motion.img
              key={previewUrl}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              src={previewUrl}
              alt="Your shareable health report"
              className="max-h-[420px] rounded-lg shadow-lg"
            />
          )}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs">
          <span className="truncate flex-1 text-muted-foreground">{link}</span>
          <button onClick={handleCopyLink} className="text-primary hover:text-primary/80">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!blob}>
            <Download className="h-4 w-4 mr-2" /> Download
          </Button>
          <Button onClick={handleNativeShare} disabled={!blob}>
            <Share2 className="h-4 w-4 mr-2" /> Share
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
