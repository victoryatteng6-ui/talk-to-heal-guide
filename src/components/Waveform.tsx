import { motion } from "framer-motion";

interface WaveformProps {
  isActive: boolean;
  barCount?: number;
  className?: string;
  color?: "primary" | "destructive";
}

export function Waveform({ isActive, barCount = 5, className = "", color = "primary" }: WaveformProps) {
  const colorClass = color === "destructive" ? "bg-destructive" : "bg-primary";

  return (
    <div className={`flex items-center justify-center gap-[3px] h-8 ${className}`} aria-hidden="true">
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-[3px] rounded-full ${colorClass}`}
          animate={
            isActive
              ? {
                  height: [8, 20 + Math.random() * 12, 6, 24 + Math.random() * 8, 8],
                  opacity: [0.6, 1, 0.5, 1, 0.6],
                }
              : { height: 4, opacity: 0.3 }
          }
          transition={
            isActive
              ? {
                  duration: 0.8 + Math.random() * 0.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.1,
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}
