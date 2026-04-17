import { WaterTracker } from "@/components/WaterTracker";
import { Disclaimer } from "@/components/Disclaimer";
import { ShareReportButton } from "@/components/ShareReportButton";
import { PremiumReportButton } from "@/components/PremiumReportButton";
import { WhatsAppShareButton } from "@/components/WhatsAppShareButton";
import { ConsultSpecialistButton } from "@/components/ConsultSpecialistButton";

export default function WellnessPage() {
  return (
    <div className="container max-w-4xl px-4 py-6 space-y-6">
      <Disclaimer />
      <header className="text-center space-y-2">
        <h1 className="font-display text-3xl font-bold">Wellness</h1>
        <p className="text-sm text-muted-foreground">Track hydration, earn Health Points, and share your progress.</p>
      </header>
      <WaterTracker />
      <div className="flex flex-wrap justify-center gap-3 pb-10">
        <ShareReportButton />
        <WhatsAppShareButton />
        <PremiumReportButton />
        <ConsultSpecialistButton />
      </div>
    </div>
  );
}
