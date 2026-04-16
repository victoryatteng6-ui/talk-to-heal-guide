import { motion } from "framer-motion";
import { Phone, AlertOctagon } from "lucide-react";

interface SOSBannerProps {
  number?: string;
}

export function SOSBanner({ number = "112" }: SOSBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      aria-live="assertive"
      className="bg-destructive px-4 py-4 text-center shadow-lg"
    >
      <div className="container mx-auto max-w-2xl flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-destructive-foreground">
          <AlertOctagon className="h-5 w-5 animate-pulse" />
          <p className="text-sm font-semibold">
            Emergency symptoms detected. Call emergency services NOW.
          </p>
        </div>
        <a
          href={`tel:${number}`}
          className="inline-flex items-center gap-2 rounded-xl bg-destructive-foreground px-8 py-4 text-base font-bold text-destructive shadow-xl ring-4 ring-destructive-foreground/30 transition-transform hover:scale-105 active:scale-95 animate-pulse-ring"
        >
          <Phone className="h-5 w-5" />
          SOS — CALL {number}
        </a>
      </div>
    </motion.div>
  );
}
