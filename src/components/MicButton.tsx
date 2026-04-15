import { Mic, MicOff } from "lucide-react";
import { motion } from "framer-motion";
import { Waveform } from "@/components/Waveform";

interface MicButtonProps {
  isListening: boolean;
  onClick: () => void;
  size?: "sm" | "lg";
}

export function MicButton({ isListening, onClick, size = "lg" }: MicButtonProps) {
  const sizeClasses = size === "lg" ? "h-24 w-24" : "h-12 w-12";
  const iconSize = size === "lg" ? 36 : 20;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onClick}
        className="relative focus:outline-none focus-visible:ring-4 focus-visible:ring-ring rounded-full"
        aria-label={isListening ? "Stop listening" : "Start listening"}
      >
        {isListening && (
          <>
            <span className={`absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring ${sizeClasses}`} />
            <span className="absolute -inset-3 rounded-full bg-primary/10 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />
          </>
        )}
        <motion.div
          whileTap={{ scale: 0.92 }}
          className={`relative ${sizeClasses} rounded-full flex items-center justify-center transition-colors ${
            isListening
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          } shadow-lg`}
        >
          {isListening ? <MicOff size={iconSize} /> : <Mic size={iconSize} />}
        </motion.div>
      </button>
      {isListening && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <Waveform isActive={isListening} barCount={size === "lg" ? 7 : 5} color="primary" />
          <p className="text-xs text-muted-foreground text-center mt-1">Listening…</p>
        </motion.div>
      )}
    </div>
  );
}
