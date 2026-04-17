import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { HealthSummaryCard } from "./HealthSummaryCard";
import { bump, getReferralLink } from "@/lib/stats";

export function WhatsAppShareButton() {
  const { toast } = useToast();
  const cardRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setLoading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "health-summary.png", { type: "image/png" });
      const link = getReferralLink();
      const text = `Check out my wellness check on Talk To Heal 💚 ${link}`;

      const navAny = navigator as any;
      if (navAny.share && navAny.canShare?.({ files: [file] })) {
        await navAny.share({ files: [file], title: "My Wellness Check", text });
        bump("shares", 1);
      } else {
        // Fallback: download image + open WhatsApp web with text
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = "health-summary.png";
        a.click();
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
        bump("shares", 1);
        toast({ title: "Image saved", description: "Attach it in the WhatsApp tab that just opened." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Could not share", description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Off-screen capture target */}
      <div className="fixed -left-[9999px] top-0 pointer-events-none" aria-hidden>
        <HealthSummaryCard ref={cardRef} />
      </div>
      <Button onClick={handleShare} disabled={loading} className="gap-2 bg-[#25D366] hover:bg-[#1fb955] text-white">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
        Share to WhatsApp
      </Button>
    </>
  );
}
